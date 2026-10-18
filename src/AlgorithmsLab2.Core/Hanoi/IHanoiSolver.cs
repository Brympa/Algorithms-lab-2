namespace AlgorithmsLab2.Core.Hanoi;

public readonly record struct HanoiMove(int Disk, int From, int To);

public interface IHanoiSolver
{
    /// <summary>"hanoi-recursive" | "hanoi-stack"</summary>
    string Id { get; }
    string Name { get; }
    string Description { get; }

    IReadOnlyList<HanoiMove> Solve(int diskCount, CancellationToken ct = default);
}

public static class HanoiMath
{
    public static int MinMoves(int diskCount) => diskCount <= 0 ? 0 : (1 << diskCount) - 1;
}
