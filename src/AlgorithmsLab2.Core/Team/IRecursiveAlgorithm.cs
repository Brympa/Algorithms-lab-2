namespace AlgorithmsLab2.Core.Team;

public sealed record BenchmarkRequest(
    int NMin,
    int NMax,
    int Step,
    int Iterations,
    string Mode = "")
{
    public static BenchmarkRequest Default { get; } = new(1, 15, 1, 5);
    public int StepsCount => Math.Max(1, (NMax - NMin) / Math.Max(1, Step) + 1);
}

public sealed record BenchmarkPoint(int N, double ElapsedMs, int Steps);

public sealed record TraceStep(int Index, string Label, string? Detail = null);

public interface IRecursiveAlgorithm
{
    string AlgorithmId { get; }

    /// <summary>
    /// Замеры с кооперативными тайм-слайсами. Реализация обязана проверять ct
    /// внутри цикла (кнопка «Стоп»).
    /// </summary>
    IAsyncEnumerable<BenchmarkPoint> RunAsync(
        BenchmarkRequest request,
        CancellationToken ct);

    IAsyncEnumerable<TraceStep> DemoAsync(
        DemoRequest request,
        CancellationToken ct);
}

public sealed record DemoRequest(int N)
{
    public static DemoRequest Default { get; } = new(5);
}
