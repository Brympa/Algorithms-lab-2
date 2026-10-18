namespace AlgorithmsLab2.Core.Hanoi;

/// <summary>
/// Итеративная версия на явном стеке фреймов (n, from, to, aux, phase).
/// Последовательность ходов обязана совпадать с RecursiveHanoiSolver.
/// </summary>
public sealed class StackHanoiSolver : IHanoiSolver
{
    public string Id => "hanoi-stack";
    public string Name => "Ханойская башня (стек)";
    public string Description =>
        "Та же стратегия, но без нативной рекурсии: явный стек фреймов (n, from, to, aux, phase).";

    public IReadOnlyList<HanoiMove> Solve(int diskCount, CancellationToken ct = default)
    {
        if (diskCount < 0)
            throw new ArgumentOutOfRangeException(nameof(diskCount));
        if (diskCount == 0)
            return Array.Empty<HanoiMove>();

        var moves = new List<HanoiMove>(HanoiMath.MinMoves(diskCount));
        var stack = new Stack<(int N, int From, int To, int Aux, int Phase)>();
        stack.Push((diskCount, 0, 2, 1, 0));

        while (stack.Count > 0)
        {
            ct.ThrowIfCancellationRequested();
            var (n, from, to, aux, phase) = stack.Pop();

            if (n == 0)
                continue;

            if (phase == 0)
            {
                // разложить: H(n-1, from, aux, to); move; H(n-1, aux, to, from)
                stack.Push((n - 1, aux, to, from, 0));
                stack.Push((n, from, to, aux, 1));
                stack.Push((n - 1, from, aux, to, 0));
            }
            else
            {
                moves.Add(new HanoiMove(n, from, to));
            }
        }

        return moves;
    }
}
