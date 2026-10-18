using AlgorithmsLab2.Core.Hanoi;

namespace AlgorithmsLab2.Web.Services;

/// <summary>
/// Playback Ханоя: state-machine на стороне C#, кадры/отрисовка — JS.
/// C# шлёт play/pause/seek/speed, не ход за ходом в rAF.
/// </summary>
public sealed class HanoiPlaybackService : IDisposable
{
    private IReadOnlyList<HanoiMove> _moves = Array.Empty<HanoiMove>();
    private CancellationTokenSource? _cts;

    public int DiskCount { get; private set; } = 8;
    public int MoveCount => _moves.Count;
    public int CurrentIndex { get; private set; }
    public bool IsPlaying { get; private set; }
    public double Speed { get; private set; } = 1.0;
    public IReadOnlyList<HanoiMove> Moves => _moves;

    public event Action? Changed;

    public void Load(IReadOnlyList<HanoiMove> moves, int diskCount)
    {
        _moves = moves;
        DiskCount = diskCount;
        CurrentIndex = 0;
        IsPlaying = false;
        _cts?.Cancel();
        Notify();
    }

    public void Play()
    {
        if (_moves.Count == 0)
            return;
        IsPlaying = true;
        _cts = new CancellationTokenSource();
        _ = RunLoopAsync(_cts.Token);
        Notify();
    }

    public void Pause()
    {
        IsPlaying = false;
        _cts?.Cancel();
        Notify();
    }

    public void Seek(int index)
    {
        CurrentIndex = Math.Clamp(index, 0, _moves.Count);
        Notify();
    }

    public void StepForward()
    {
        Seek(CurrentIndex + 1);
    }

    public void StepBack()
    {
        Seek(CurrentIndex - 1);
    }

    public void Reset()
    {
        Pause();
        Seek(0);
    }

    public void SetSpeed(double speed)
    {
        Speed = Math.Clamp(speed, 0.25, 8);
        Notify();
    }

    private async Task RunLoopAsync(CancellationToken ct)
    {
        try
        {
            while (!ct.IsCancellationRequested && CurrentIndex < _moves.Count)
            {
                var delay = TimeSpan.FromMilliseconds(Math.Max(30, 280 / Speed));
                await Task.Delay(delay, ct);
                if (ct.IsCancellationRequested)
                    break;
                CurrentIndex++;
                Notify();
            }
        }
        catch (OperationCanceledException)
        {
            // pause / dispose
        }

        if (!ct.IsCancellationRequested)
        {
            IsPlaying = false;
            Notify();
        }
    }

    private void Notify() => Changed?.Invoke();

    public void Dispose()
    {
        _cts?.Cancel();
        _cts?.Dispose();
    }
}
