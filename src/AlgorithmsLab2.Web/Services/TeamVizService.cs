using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace AlgorithmsLab2.Web.Services;

/// <summary>Визуализация деревьев/разбиений для командных алгоритмов.</summary>
public sealed class TeamVizService : IAsyncDisposable
{
    private readonly IJSRuntime _js;
    private IJSObjectReference? _module;

    public TeamVizService(IJSRuntime js) => _js = js;

    private async ValueTask<IJSObjectReference> ModuleAsync()
    {
        _module ??= await _js.InvokeAsync<IJSObjectReference>("import", "./js/viz.js");
        return _module;
    }

    public async Task CreateAsync(ElementReference canvas)
    {
        var m = await ModuleAsync();
        await m.InvokeVoidAsync("createViz", canvas);
    }

    public async Task DrawTreeAsync(
        ElementReference canvas,
        IReadOnlyList<(double X, double Y)> nodes,
        IReadOnlyList<(int A, int B)> edges,
        IReadOnlyList<string> labels)
    {
        var m = await ModuleAsync();
        float[] xy = new float[nodes.Count * 2];
        for (int i = 0; i < nodes.Count; i++)
        {
            xy[i * 2] = (float)nodes[i].X;
            xy[i * 2 + 1] = (float)nodes[i].Y;
        }

        int[] e = new int[edges.Count * 2];
        for (int i = 0; i < edges.Count; i++)
        {
            e[i * 2] = edges[i].A;
            e[i * 2 + 1] = edges[i].B;
        }

        byte[] nodeBytes = MemoryMarshal.AsBytes(xy.AsSpan()).ToArray();
        byte[] edgeBytes = MemoryMarshal.AsBytes(e.AsSpan()).ToArray();
        await m.InvokeVoidAsync("drawTree", canvas, nodeBytes, edgeBytes, labels);
    }

    public async Task DrawBarsAsync(ElementReference canvas, IReadOnlyList<float> values, string title)
    {
        var m = await ModuleAsync();
        float[] arr = values.ToArray();
        byte[] bytes = MemoryMarshal.AsBytes(arr.AsSpan()).ToArray();
        await m.InvokeVoidAsync("drawBars", canvas, bytes, title);
    }

    public async Task BindRangeFillsAsync()
    {
        if (_module is null)
            return;
        await _module.InvokeVoidAsync("bindRangeFills", null);
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
