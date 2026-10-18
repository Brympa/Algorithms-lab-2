using System.Runtime.CompilerServices;
using AlgorithmsLab2.Core.Meta;

namespace AlgorithmsLab2.Core.Team.Algorithms;

/// <summary>
/// SLOT-B: Дерево Штерна–Броко (Stern–Brocot tree) — рекурсивное порождение
/// всех положительных рациональных чисел через медианты.
///
/// Медианта a/b и c/d: (a+c)/(b+d).
/// Дерево: рекурсия влево (a/b, m/n) и вправо (m/n, c/d); в корне — медианта.
/// Глубина d → 2^d − 1 вершин. Поиск дроби — O(log) сравнений (бинарный в дереве).
///
/// Сложность по шагам: генерация O(2^d), поиск O(depth) ≤ O(log denominator).
/// </summary>
public sealed class SternBrocotAlgorithm : ITeamAlgorithm, IRecursiveAlgorithm
{
    public string Id => "team-stern-brocot";
    public string Slot => "slot-b";
    public string Name => "Дерево Штерна–Броко";
    public string Description =>
        "Рекурсивное построение дерева положительных рациональных чисел через медианты " +
        "(a+c)/(b+d). Каждая дробь встречается ровно один раз; inorder-обход даёт " +
        "возрастающую последовательность. Поиск дроби в дереве — рекурсивное сравнение с медиантой.";
    public string PracticalApplication =>
        "Генерация всех рациональных чисел, дробные приближения, деревья Calkin–Wilf и Farey, " +
        "визуализация структуры Q+, алгоритмы сортировки дробей без приведения к float.";
    public ComplexityInfo Complexity { get; } = new(
        Display: "генерация O(2^d), поиск O(log q)",
        Best: "поиск: O(1) совпадение на корне",
        Average: "поиск: O(log q) — высота дерева",
        Worst: "генерация дерева глубины d: O(2^d)");

    public IReadOnlyList<string> Sources { get; } = new[]
    {
        "Stern M.A., Brocot A. (1858) — дерево дробей",
        "Concrete Mathematics (Graham, Knuth, Patashnik) — Stern-Brocot tree",
        "https://en.wikipedia.org/wiki/Stern%E2%80%93Brocot_tree"
    };

    public bool IsReady => true;
    public string AlgorithmId => Id;

    /// <summary>Дробь: числитель / знаменатель.</summary>
    public readonly record struct Fraction(long Num, long Den)
    {
        public override string ToString() => $"{Num}/{Den}";
        public int CompareTo(Fraction other) => (Num * other.Den).CompareTo(other.Num * Den);
    }

    /// <summary>Генерация inorder-вершин поддерева (рекурсия). Число вершин 2^(depth+1)-1…</summary>
    public IReadOnlyList<Fraction> GenerateTree(int depth, CancellationToken ct = default)
    {
        if (depth < 0)
            throw new ArgumentOutOfRangeException(nameof(depth));
        if (depth > 16)
            throw new ArgumentOutOfRangeException(nameof(depth), "depth≤16 достаточно (2^16 вершин).");

        var result = new List<Fraction>();
        // Отрезок (0/1, 1/0) — как в каноне Штерна–Броко
        Walk(0, 1, 1, 0, depth, result, ct);
        return result;
    }

    private static void Walk(long a, long b, long c, long d, int depth, List<Fraction> acc, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (depth == 0)
            return;

        long m = a + c;
        long n = b + d;

        Walk(a, b, m, n, depth - 1, acc, ct);
        acc.Add(new Fraction(m, n));
        Walk(m, n, c, d, depth - 1, acc, ct);
    }

    /// <summary>
    /// Рекурсивный поиск дроби p/q в дереве. Возвращает путь 'L'/'R' от корня и глубину.
    /// </summary>
    public (string Path, int Depth, int Steps) FindPath(long p, long q, CancellationToken ct = default)
    {
        if (p <= 0 || q <= 0)
            throw new ArgumentOutOfRangeException("дробь должна быть положительной.");

        var path = new System.Text.StringBuilder();
        int steps = 0;
        int depth = FindRec(0, 1, 1, 0, p, q, path, ref steps, ct);
        return (path.ToString(), depth, steps);
    }

    private static int FindRec(
        long a, long b, long c, long d,
        long p, long q,
        System.Text.StringBuilder path,
        ref int steps,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        steps++;

        long m = a + c;
        long n = b + d;

        // сопоставляем p/q и m/n крест-умножением (без float)
        long left = p * n;
        long right = q * m;

        if (left == right)
        {
            path.Append('*');
            return 1;
        }

        if (left < right)
        {
            path.Append('L');
            return 1 + FindRec(a, b, m, n, p, q, path, ref steps, ct);
        }

        path.Append('R');
        return 1 + FindRec(m, n, c, d, p, q, path, ref steps, ct);
    }

    public async IAsyncEnumerable<BenchmarkPoint> RunAsync(
        BenchmarkRequest request,
        [EnumeratorCancellation] CancellationToken ct)
    {
        // n = глубина дерева; шаги = число посещений Walk / число сравнений Find
        for (int d = Math.Max(1, request.NMin); d <= request.NMax; d += Math.Max(1, request.Step))
        {
            ct.ThrowIfCancellationRequested();
            var elapsed = new List<double>(request.Iterations);
            long steps = 0;

            for (int iter = 0; iter < request.Iterations; iter++)
            {
                ct.ThrowIfCancellationRequested();
                var sw = System.Diagnostics.Stopwatch.StartNew();
                var tree = GenerateTree(Math.Min(d, 12), ct);
                sw.Stop();
                elapsed.Add(sw.Elapsed.TotalMilliseconds);
                steps += tree.Count; // вершины как «шаги» генерации
            }

            var stats = Benchmark.BenchmarkRunner.Aggregate(d, elapsed, steps / Math.Max(1, request.Iterations));
            yield return new BenchmarkPoint(d, stats.MeanMs, (int)(steps / Math.Max(1, request.Iterations)));

            await Task.Yield();
        }
    }

    public async IAsyncEnumerable<TraceStep> DemoAsync(
        DemoRequest request,
        [EnumeratorCancellation] CancellationToken ct)
    {
        int depth = Math.Clamp(request.N, 1, 8);
        yield return new TraceStep(0, "Старт", $"глубина дерева = {depth}");

        yield return new TraceStep(1, "Канон", "отрезок (0/1, 1/0), медианта (a+c)/(b+d)");

        var tree = GenerateTree(depth, ct);
        yield return new TraceStep(2, "Дерево", $"вершин: {tree.Count} = 2^{depth}−1");

        int idx = 3;
        foreach (var f in tree.Take(32))
        {
            yield return new TraceStep(idx++, "inorder", f.ToString());
            if (idx % 16 == 0)
                await Task.Yield();
        }

        if (tree.Count > 32)
            yield return new TraceStep(idx++, "…", $"ещё {tree.Count - 32} вершин");

        // демонстрация поиска
        var sample = tree.Count > 0 ? tree[tree.Count / 2] : new Fraction(1, 1);
        var (path, dFind, steps) = FindPath(sample.Num, sample.Den, ct);
        yield return new TraceStep(idx++, "Поиск", $"{sample}: путь {path}, глубина {dFind}, шагов {steps}");

        yield return new TraceStep(idx, "Итог", $"рекурсия Walk + FindPath · {tree.Count} дробей");
    }
}
