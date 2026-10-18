using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace AlgorithmsLab2.Web.Services;

/// <summary>
/// Тонкий interop к canvas.js. Передаём только TypedArray (byte[] → Uint8Array → Float32Array).
/// </summary>
public sealed class CanvasRenderService : IAsyncDisposable
{
    private readonly IJSRuntime _js;
    private IJSObjectReference? _module;

    public CanvasRenderService(IJSRuntime js) => _js = js;

    private async ValueTask<IJSObjectReference> ModuleAsync()
    {
        _module ??= await _js.InvokeAsync<IJSObjectReference>("import", "./js/canvas.js");
        return _module;
    }

    public async Task CreateHostAsync(ElementReference canvas)
    {
        var m = await ModuleAsync();
        await m.InvokeVoidAsync("createHost", canvas);
    }

    public async Task DisposeHostAsync(ElementReference canvas)
    {
        if (_module is null)
            return;
        await _module.InvokeVoidAsync("disposeHost", canvas);
    }

    public async Task DrawPolylineAsync(
        ElementReference canvas,
        ReadOnlyMemory<float> xy,
        DrawOptions options)
    {
        var m = await ModuleAsync();
        byte[] bytes = ToBytes(xy);
        await m.InvokeVoidAsync("drawPolyline", canvas, bytes, options);
    }

    public async Task ExportPngAsync(ElementReference canvas, string fileName)
    {
        var m = await ModuleAsync();
        await m.InvokeVoidAsync("exportPng", canvas, fileName);
    }

    private static byte[] ToBytes(ReadOnlyMemory<float> xy)
    {
        var span = xy.Span;
        return MemoryMarshal.AsBytes(span).ToArray();
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

/// <summary>Опции отрисовки (camelCase для JS).</summary>
public sealed record DrawOptions(
    string LineColor,
    double LineWidth,
    string Background,
    double Pad,
    string? Glow,
    double? Progress);
