using System.Runtime.CompilerServices;
using AlgorithmsLab2.Core.Meta;

namespace AlgorithmsLab2.Core.Team.Algorithms;

/// <summary>
/// MAIN: Разбиение числа на слагаемые (integer partitions).
/// Рекурсия: Partition(n, max) → для k=min(n,max): k + Partition(n-k, k).
/// p(5)=7, p(10)=42. Демо n≤30 (экспонента Hardy–Ramanujan).
/// </summary>
public sealed class IntegerPartitionsAlgorithm : ITeamAlgorithm, IRecursiveAlgorithm
{
    public string Id => "team-integer-partitions";
    public string Slot => "main";
    public string Name => "Разбиение числа на слагаемые";
    public string Description =>
        "Перечисление всех разбиений n = a1 + a2 + … + ak, ai ≥ 1 (неупорядоченные, a1 ≥ a2 ≥ …). " +
        "Рекурсия Partition(n, max): перебираем первое слагаемое k ≤ min(n, max), затем разбиваем n − k с ограничением k.";
    public string PracticalApplication =>
        "Комбинаторика, теория чисел, динамическое программирование, генерация тестовых данных, " +
        "разбор задач на размещение/разделение ресурсов.";
    public ComplexityInfo Complexity { get; } = new(
        Display: "O(p(n) · n) перечисление, p(n) ~ exp(π√(2n/3))",
        Best: "O(1) при n=0/1",
        Average: "экспоненциально по n",
        Worst: "экспоненциально по n");

    public IReadOnlyList<string> Sources { get; } = new[]
    {
        "Hardy–Ramanujan asymptotic for p(n)",
        "Knuth, TAOCP Vol. 1 — compositions and partitions",
        "https://en.wikipedia.org/wiki/Partition_(number_theory)"
    };

    public bool IsReady => true;
    public string AlgorithmId => Id;

    public async IAsyncEnumerable<BenchmarkPoint> RunAsync(
        BenchmarkRequest request,
        [EnumeratorCancellation] CancellationToken ct)
    {
        for (int n = request.NMin; n <= request.NMax; n += Math.Max(1, request.Step))
        {
            ct.ThrowIfCancellationRequested();
            var elapsed = new List<double>(request.Iterations);
            long steps = 0;

            for (int iter = 0; iter < request.Iterations; iter++)
            {
                ct.ThrowIfCancellationRequested();
                var sw = System.Diagnostics.Stopwatch.StartNew();
                var (count, localSteps) = CountPartitionsWithSteps(n, ct);
                sw.Stop();
                elapsed.Add(sw.Elapsed.TotalMilliseconds);
                steps += localSteps;
                _ = count;
            }

            var stats = Benchmark.BenchmarkRunner.Aggregate(n, elapsed, steps / Math.Max(1, request.Iterations));
            yield return new BenchmarkPoint(n, stats.MeanMs, (int)(steps / Math.Max(1, request.Iterations)));

            // тайм-слайс, чтобы UI жил
            await Task.Yield();
        }
    }

    public async IAsyncEnumerable<TraceStep> DemoAsync(
        DemoRequest request,
        [EnumeratorCancellation] CancellationToken ct)
    {
        int n = Math.Clamp(request.N, 0, 30);
        yield return new TraceStep(0, "Старт", $"n = {n}");

        int index = 1;
        foreach (var parts in EnumeratePartitions(n, ct))
        {
            ct.ThrowIfCancellationRequested();
            yield return new TraceStep(index++, "Разбиение", string.Join(" + ", parts));
            if (index > 200)
            {
                yield return new TraceStep(index, "Стоп демо", "… (обрезано, полный список в замерах)");
                break;
            }
            if (index % 16 == 0)
                await Task.Yield();
        }

        int total = CountPartitions(n, ct);
        yield return new TraceStep(index, "Итог", $"p({n}) = {total}");
    }

    /// <summary>Число неупорядоченных разбиений p(n). DP: O(n^2).</summary>
    public int CountPartitions(int n, CancellationToken ct = default)
    {
        if (n < 0)
            throw new ArgumentOutOfRangeException(nameof(n));
        if (n == 0)
            return 1;

        var dp = new int[n + 1];
        dp[0] = 1;
        for (int part = 1; part <= n; part++)
        {
            for (int i = part; i <= n; i++)
            {
                ct.ThrowIfCancellationRequested();
                dp[i] += dp[i - part];
            }
        }

        return dp[n];
    }

    /// <summary>Счётчик элементарных шагов DP (для графиков «шаги от n»).</summary>
    public (int Count, long Steps) CountPartitionsWithSteps(int n, CancellationToken ct = default)
    {
        if (n < 0)
            throw new ArgumentOutOfRangeException(nameof(n));
        if (n == 0)
            return (1, 0);

        var dp = new int[n + 1];
        dp[0] = 1;
        long steps = 0;
        for (int part = 1; part <= n; part++)
        {
            for (int i = part; i <= n; i++)
            {
                ct.ThrowIfCancellationRequested();
                steps++;
                dp[i] += dp[i - part];
            }
        }

        return (dp[n], steps);
    }

    /// <summary>Явная рекурсия перечисления (для демо/тестов).</summary>
    public IEnumerable<IReadOnlyList<int>> EnumeratePartitions(int n, CancellationToken ct)
    {
        var current = new List<int>();
        foreach (var _ in EnumerateCore(n, n, current, ct))
            yield return current.ToArray();
    }

    private static IEnumerable<bool> EnumerateCore(int n, int max, List<int> acc, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (n == 0)
        {
            yield return true;
            yield break;
        }

        for (int k = Math.Min(n, max); k >= 1; k--)
        {
            acc.Add(k);
            foreach (var _ in EnumerateCore(n - k, k, acc, ct))
                yield return true;
            acc.RemoveAt(acc.Count - 1);
        }
    }
}
