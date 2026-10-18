namespace AlgorithmsLab2.Core.Hanoi;

/// <summary>Классическая рекурсия Hanoi(n, from, to, aux). Ходов: 2^n − 1.</summary>
public sealed class RecursiveHanoiSolver : IHanoiSolver
{
    public string Id => "hanoi-recursive";
    public string Name => "Ханойская башня (рекурсия)";
    public string Description =>
        "Hanoi(n, from, to, aux) = Hanoi(n-1, from, aux, to); move; Hanoi(n-1, aux, to, from).";

    public IReadOnlyList<HanoiMove> Solve(int diskCount, CancellationToken ct = default)
    {
        if (diskCount < 0)
            throw new ArgumentOutOfRangeException(nameof(diskCount));
        if (diskCount == 0)
            return Array.Empty<HanoiMove>();

        var moves = new List<HanoiMove>(HanoiMath.MinMoves(diskCount));
        Recurse(diskCount, 0, 2, 1, moves, ct);
        return moves;
    }

    private static void Recurse(int n, int from, int to, int aux, List<HanoiMove> moves, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (n == 0)
            return;

        Recurse(n - 1, from, aux, to, moves, ct);
        moves.Add(new HanoiMove(n, from, to));
        Recurse(n - 1, aux, to, from, moves, ct);
    }
}
