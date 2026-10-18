namespace AlgorithmsLab2.Core.Benchmark;

/// <summary>
/// Единый helper для UI-живых циклов на однопоточном WASM:
/// work батчами, yield каждые sliceMs, честная отмена.
/// </summary>
public static class CooperativeLoop
{
    public static readonly TimeSpan DefaultSlice = TimeSpan.FromMilliseconds(8);

    /// <summary>Выполняет body до окончания; yield каждые sliceMs.</summary>
    public static async Task RunSliceAsync(
        Func<bool> body,
        TimeSpan slice,
        CancellationToken ct)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        while (true)
        {
            ct.ThrowIfCancellationRequested();
            if (!body())
                return;

            if (sw.Elapsed >= slice)
            {
                await Task.Yield();
                sw.Restart();
            }
        }
    }

    public static void ThrowIfCancellationRequested(this CancellationToken ct) =>
        ct.ThrowIfCancellationRequested();
}
