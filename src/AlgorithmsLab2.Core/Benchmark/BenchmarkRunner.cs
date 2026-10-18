namespace AlgorithmsLab2.Core.Benchmark;

/// <summary>Статистика серии прогонов: Mean ± σ (не путать MSE ошибки аппроксимации).</summary>
public sealed record SeriesStats(
    int N,
    double MeanMs,
    double StdDevMs,
    int Iterations,
    long TotalSteps)
{
    public double StdErrMs => Iterations <= 1 ? 0 : StdDevMs / Math.Sqrt(Iterations);
}

public static class BenchmarkRunner
{
    public static SeriesStats Aggregate(int n, IReadOnlyList<double> elapsedMs, long totalSteps)
    {
        if (elapsedMs.Count == 0)
            return new SeriesStats(n, 0, 0, 0, totalSteps);

        double mean = elapsedMs.Average();
        double var = elapsedMs.Count == 1
            ? 0
            : elapsedMs.Sum(t => (t - mean) * (t - mean)) / (elapsedMs.Count - 1);
        double sd = Math.Sqrt(var);
        return new SeriesStats(n, mean, sd, elapsedMs.Count, totalSteps);
    }
}
