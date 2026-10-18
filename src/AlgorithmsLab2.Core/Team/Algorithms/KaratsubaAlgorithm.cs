using System.Numerics;
using System.Runtime.CompilerServices;
using AlgorithmsLab2.Core.Meta;

namespace AlgorithmsLab2.Core.Team.Algorithms;

/// <summary>
/// SLOT-C: Алгоритм Карацубы — быстрое умножение больших чисел (рекурсия).
///
/// X = a·B^m + b,  Y = c·B^m + d
/// XY = ac·B^{2m} + ((a+b)(c+d) − ac − bd)·B^m + bd
/// Рекурсивные вызовы: 3 вместо 4 → O(n^{log₂ 3}) ≈ O(n^1.585).
///
/// Значения — <see cref="BigInteger"/> (нет переполнения); счётчик шагов — в <see cref="Counters"/>.
/// </summary>
public sealed class KaratsubaAlgorithm : ITeamAlgorithm, IRecursiveAlgorithm
{
    public string Id => "team-karatsuba";
    public string Slot => "slot-c";
    public string Name => "Умножение Карацубы";
    public string Description =>
        "Рекурсивное умножение больших чисел: деление пополам, 3 подвызова вместо 4 " +
        "(ac, bd, (a+b)(c+d)), сборка через сдвиги по B=10^m. Базовый случай — «школьное» умножение.";
    public string PracticalApplication =>
        "Криптография (RSA, большие простые), длинная арифметика, полиномиальное умножение, " +
        "базовые блоки FFT-умножения, компьютерная алгебра.";
    public ComplexityInfo Complexity { get; } = new(
        Display: "O(n^{log₂3}) ≈ O(n^1.585)",
        Best: "O(1) для одного разряда",
        Average: "O(n^1.585)",
        Worst: "O(n^1.585)");

    public IReadOnlyList<string> Sources { get; } = new[]
    {
        "Karatsuba A.A., Ofman Yu.P. (1962) — умножение многозначных чисел",
        "Кнут, TAOCP Vol. 2 — быстрое умножение",
        "https://en.wikipedia.org/wiki/Karatsuba_algorithm"
    };

    public bool IsReady => true;
    public string AlgorithmId => Id;

    public sealed class Counters
    {
        public long MultiplyCalls;
        public long AddOps;
        public long SchoolbookCells;
    }

    /// <summary>Рекурсивное Карацуба-умножение (неотрицательные).</summary>
    public BigInteger Multiply(BigInteger x, BigInteger y, Counters? counters = null, CancellationToken ct = default)
    {
        counters ??= new Counters();
        return MultiplyCore(BigInteger.Abs(x), BigInteger.Abs(y), counters, ct);
    }

    private BigInteger MultiplyCore(BigInteger x, BigInteger y, Counters counters, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        counters.MultiplyCalls++;

        if (x.IsZero || y.IsZero)
            return BigInteger.Zero;

        // База: школьное умножение малых разрядов
        if (x < 1024 && y < 1024)
        {
            counters.SchoolbookCells++;
            return x * y;
        }

        int digits = Math.Max(DecDigits(x), DecDigits(y));
        int m = Math.Max(1, digits / 2);
        BigInteger B = BigInteger.Pow(10, m);

        var a = BigInteger.DivRem(x, B, out var b);
        var c = BigInteger.DivRem(y, B, out var d);

        // 3 рекурсивных вызова — суть Карацубы
        BigInteger ac = MultiplyCore(a, c, counters, ct);
        BigInteger bd = MultiplyCore(b, d, counters, ct);
        counters.AddOps += 2;
        BigInteger abcd = MultiplyCore(a + b, c + d, counters, ct);

        BigInteger middle = abcd - ac - bd;
        counters.AddOps += 3;

        // ac·B^{2m} + middle·B^m + bd
        BigInteger result = ac * BigInteger.Pow(B, 2) + middle * B + bd;
        counters.AddOps += 3;
        return result;
    }

    public IReadOnlyList<string> TraceMultiply(BigInteger x, BigInteger y, CancellationToken ct = default)
    {
        var log = new List<string>();
        Trace(BigInteger.Abs(x), BigInteger.Abs(y), 0, log, ct);
        return log;
    }

    private void Trace(BigInteger x, BigInteger y, int depth, List<string> log, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        string pad = new string(' ', depth * 2);
        if (x < 1024 && y < 1024)
        {
            log.Add($"{pad}школ: {x}·{y}={x * y}");
            return;
        }

        int digits = Math.Max(DecDigits(x), DecDigits(y));
        int m = Math.Max(1, digits / 2);
        BigInteger B = BigInteger.Pow(10, m);
        var a = BigInteger.DivRem(x, B, out var b);
        var c = BigInteger.DivRem(y, B, out var d);
        log.Add($"{pad}делит: {x} = {a}·10^{m} + {b}   {y} = {c}·10^{m} + {d}");

        log.Add($"{pad}→ ac = Multiply({a},{c})");
        Trace(a, c, depth + 1, log, ct);
        log.Add($"{pad}→ bd = Multiply({b},{d})");
        Trace(b, d, depth + 1, log, ct);
        log.Add($"{pad}→ (a+b)(c+d) = Multiply({a + b},{c + d})");
        Trace(a + b, c + d, depth + 1, log, ct);
    }

    public async IAsyncEnumerable<BenchmarkPoint> RunAsync(
        BenchmarkRequest request,
        [EnumeratorCancellation] CancellationToken ct)
    {
        for (int n = Math.Max(1, request.NMin); n <= request.NMax; n += Math.Max(1, request.Step))
        {
            ct.ThrowIfCancellationRequested();
            var elapsed = new List<double>(request.Iterations);
            long steps = 0;

            for (int iter = 0; iter < request.Iterations; iter++)
            {
                ct.ThrowIfCancellationRequested();
                var counters = new Counters();
                var (x, y) = MakeOperands(n);

                var sw = System.Diagnostics.Stopwatch.StartNew();
                _ = Multiply(x, y, counters, ct);
                sw.Stop();

                elapsed.Add(sw.Elapsed.TotalMilliseconds);
                steps += counters.MultiplyCalls;
            }

            var stats = Benchmark.BenchmarkRunner.Aggregate(n, elapsed, steps / Math.Max(1, request.Iterations));
            yield return new BenchmarkPoint(n, stats.MeanMs, (int)(steps / Math.Max(1, request.Iterations)));

            await Task.Yield();
        }
    }

    public async IAsyncEnumerable<TraceStep> DemoAsync(
        DemoRequest request,
        [EnumeratorCancellation] CancellationToken ct)
    {
        int n = Math.Clamp(request.N, 1, 40);
        var (x, y) = MakeOperands(n);
        yield return new TraceStep(0, "Старт", $"{Trim(x)} × {Trim(y)}  (≈10^{n})");

        var counters = new Counters();
        BigInteger product = Multiply(x, y, counters, ct);
        yield return new TraceStep(1, "Ответ", Trim(product));

        yield return new TraceStep(2, "Счётчики",
            $"Multiply×{counters.MultiplyCalls}, add×{counters.AddOps}, school×{counters.SchoolbookCells}");

        int idx = 3;
        foreach (var line in TraceMultiply(x, y, ct).Take(36))
        {
            yield return new TraceStep(idx++, "Разбор", TrimLine(line));
            if (idx % 12 == 0)
                await Task.Yield();
        }

        yield return new TraceStep(idx, "Итог", "3 подвызова вместо 4 · O(n^1.585)");
    }

    private static string Trim(BigInteger v)
    {
        string s = v.ToString();
        return s.Length <= 48 ? s : s[..20] + "…" + s[^12..];
    }

    private static string TrimLine(string line) =>
        line.Length <= 100 ? line : line[..100] + "…";

    private static (BigInteger X, BigInteger Y) MakeOperands(int digits)
    {
        var xs = new System.Text.StringBuilder();
        var ys = new System.Text.StringBuilder();
        for (int i = 0; i < digits; i++)
        {
            xs.Append((char)('1' + i % 9));
            ys.Append((char)('1' + (i * 3 + 5) % 9));
        }

        return (BigInteger.Parse(xs.ToString()), BigInteger.Parse(ys.ToString()));
    }

    private static int DecDigits(BigInteger v)
    {
        if (v.IsZero)
            return 1;
        // log10 ≈ длина десятичной записи
        return v.ToString().Length;
    }
}
