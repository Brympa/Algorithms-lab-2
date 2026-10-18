using AlgorithmsLab2.Core.Hanoi;
using AlgorithmsLab2.Core.Team.Algorithms;
using AlgorithmsLab2.Core;

namespace AlgorithmsLab2.Tests;

public class CatalogTests
{
    [Fact]
    public void Register_Default_Contains_Expected()
    {
        var (fractals, team, hanoi) = AllAlgorithms.CreateDefault();

        Assert.NotNull(fractals.Get("gosper"));
        Assert.NotNull(hanoi.Get("hanoi-recursive"));
        Assert.NotNull(hanoi.Get("hanoi-stack"));
        Assert.NotNull(team.Get("team-integer-partitions"));
        Assert.NotNull(team.Get("team-slot-b"));
        Assert.NotNull(team.Get("team-slot-c"));
    }

    [Fact]
    public void Stubs_Are_Not_Ready()
    {
        var (_, team, _) = AllAlgorithms.CreateDefault();
        Assert.False(team.Get("team-slot-b")!.IsReady);
        Assert.False(team.Get("team-slot-c")!.IsReady);
        Assert.True(team.Get("team-integer-partitions")!.IsReady);
    }
}

public class HanoiSolverTests
{
    [Theory]
    [InlineData(1, 1)]
    [InlineData(3, 7)]
    [InlineData(8, 255)]
    public void Recursive_MinMoves(int n, int expected)
    {
        var solver = new RecursiveHanoiSolver();
        var moves = solver.Solve(n);
        Assert.Equal(expected, moves.Count);
    }

    [Fact]
    public void Recursive_Equals_Stack()
    {
        var rec = new RecursiveHanoiSolver();
        var stack = new StackHanoiSolver();
        Assert.Equal(rec.Solve(8), stack.Solve(8));
    }

    [Fact]
    public void All_Moves_Legal()
    {
        var moves = new RecursiveHanoiSolver().Solve(8);
        var pegs = new List<int>[3];
        for (int i = 0; i < 3; i++)
            pegs[i] = new List<int>();
        for (int d = 8; d >= 1; d--)
            pegs[0].Add(d);

        foreach (var m in moves)
        {
            Assert.NotEmpty(pegs[m.From]);
            int disk = pegs[m.From][^1];
            if (pegs[m.To].Count > 0)
                Assert.True(pegs[m.To][^1] > disk, "большее кольцо не может лежать на меньшем");
            pegs[m.From].RemoveAt(pegs[m.From].Count - 1);
            pegs[m.To].Add(disk);
        }

        Assert.Empty(pegs[0]);
        Assert.Empty(pegs[1]);
        Assert.Equal(8, pegs[2].Count);
    }
}

public class IntegerPartitionsTests
{
    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 1)]
    [InlineData(5, 7)]
    [InlineData(10, 42)]
    public void CountPartitions_Known(int n, int expected)
    {
        var algo = new IntegerPartitionsAlgorithm();
        Assert.Equal(expected, algo.CountPartitions(n));
    }

    [Fact]
    public void Enumerate_Matches_Count()
    {
        var algo = new IntegerPartitionsAlgorithm();
        var list = algo.EnumeratePartitions(5, CancellationToken.None).ToList();
        Assert.Equal(7, list.Count);
        Assert.All(list, p => Assert.Equal(5, p.Sum()));
    }
}
