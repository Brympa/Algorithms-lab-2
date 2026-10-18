using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace AlgorithmsLab2.Web.Services;

/// <summary>Простой canvas-график замеров (Points → линия), без Chart.js.</summary>
public sealed class MiniChartService : IAsyncDisposable
{
    private readonly IJSRuntime _js;
    private IJSObjectReference? _module;

    public MiniChartService(IJSRuntime js) => _js = js;

    private async ValueTask<IJSObjectReference> ModuleAsync()
    {
        _module ??= await _js.InvokeAsync<IJSObjectReference>("import", "./js/chart.js");
        return _module;
    }

    public async Task CreateAsync(ElementReference canvas)
    {
        var m = await ModuleAsync();
        await m.InvokeVoidAsync("createChart", canvas);
    }

    public async Task DrawAsync(
        ElementReference canvas,
        IReadOnlyList<(double X, double Y)> points,
        ChartOptions options)
    {
        var m = await ModuleAsync();
        // two float32 buffers: xs, ys
        float[] xs = new float[points.Count];
        float[] ys = new float[points.Count];
        for (int i = 0; i < points.Count; i++)
        {
            xs[i] = (float)points[i].X;
            ys[i] = (float)points[i].Y;
        }

        byte[] xBytes = MemoryMarshal.AsBytes(xs.AsSpan()).ToArray();
        byte[] yBytes = MemoryMarshal.AsBytes(ys.AsSpan()).ToArray();
        await m.InvokeVoidAsync("drawChart", canvas, xBytes, yBytes, options);
    }

    public async ValueTask DisposeAsync()
    {
        if (_module is not null)
        {
            try
            {
                await _module.DisposeAsync();
            }
            catch (JSDisconnectedException)
            {
            }

            _module = null;
        }
    }
}

public sealed record ChartOptions(
    string LineColor,
    string PointColor,
    string Title,
    string XLabel,
    string YLabel,
    bool YLogScale);
