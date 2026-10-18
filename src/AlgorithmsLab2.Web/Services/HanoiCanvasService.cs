using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace AlgorithmsLab2.Web.Services;

/// <summary>
/// Interop арены Ханоя. Ходы — Uint8Array (disk, from, to), состояние кадров — JS.
/// C# шлёт только loadMoves / setIndex / dispose.
/// </summary>
public sealed class HanoiCanvasService : IAsyncDisposable
{
    private readonly IJSRuntime _js;
    private IJSObjectReference? _module;

    public HanoiCanvasService(IJSRuntime js) => _js = js;

    private async ValueTask<IJSObjectReference> ModuleAsync()
    {
        _module ??= await _js.InvokeAsync<IJSObjectReference>("import", "./js/hanoi.js");
        return _module;
    }

    public async Task CreateAsync(ElementReference canvas)
    {
        var m = await ModuleAsync();
        await m.InvokeVoidAsync("createHanoi", canvas);
    }

    public async Task LoadMovesAsync(ElementReference canvas, int disks, IReadOnlyList<Core.Hanoi.HanoiMove> moves)
    {
        var m = await ModuleAsync();
        byte[] packed = Pack(moves);
        await m.InvokeVoidAsync("loadMoves", canvas, disks, packed);
    }

    public async Task SetIndexAsync(ElementReference canvas, int index)
    {
        if (_module is null)
            return;
        await _module.InvokeVoidAsync("setIndex", canvas, index);
    }

    public async Task DisposeAsync(ElementReference canvas)
    {
        if (_module is null)
            return;
        await _module.InvokeVoidAsync("disposeHanoi", canvas);
    }

    /// <summary>Компактная упаковка: по 3 байта на ход.</summary>
    private static byte[] Pack(IReadOnlyList<Core.Hanoi.HanoiMove> moves)
    {
        var buf = new byte[moves.Count * 3];
        for (int i = 0; i < moves.Count; i++)
        {
            var m = moves[i];
            buf[i * 3] = (byte)m.Disk;
            buf[i * 3 + 1] = (byte)m.From;
            buf[i * 3 + 2] = (byte)m.To;
        }

        return buf;
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
