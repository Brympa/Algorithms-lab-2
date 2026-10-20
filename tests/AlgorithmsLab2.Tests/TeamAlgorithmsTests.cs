using System.Numerics;
using AlgorithmsLab2.Core.Team.Algorithms;

namespace AlgorithmsLab2.Tests;

public class SternBrocotTests
{
    private readonly SternBrocotAlgorithm _algo = new();

    [Fact]
    public void GenerateTree_Depth2_Has3Nodes()
    {
        var tree = _algo.GenerateTree(2);
        Assert.Equal(3, tree.Count);
    }

    [Fact]
    public void GenerateTree_Depth3_Has7Nodes()
    {
        var tree = _algo.GenerateTree(3);
        Assert.Equal(7, tree.Count);
    }

    [Fact]
    public void GenerateTree_Inorder_Increasing()
    {
        var tree = _algo.GenerateTree(5);
        for (int i = 1; i < tree.Count; i++)
        {
            long left = tree[i - 1].Num * tree[i].Den;
            long right = tree[i].Num * tree[i - 1].Den;
            Assert.True(left < right, $"{tree[i - 1]} !< {tree[i]}");
        }
    }

    [Fact]
    public void FindPath_Root()
    {
        var (path, depth, steps) = _algo.FindPath(1, 1);
        Assert.Equal("*", path);
        Assert.Equal(1, depth);
        Assert.Equal(1, steps);
    }

    [Fact]
    public void FindPath_Matches_Tree()
    {
        var tree = _algo.GenerateTree(6);
        var target = tree[10];
        var (path, depth, steps) = _algo.FindPath(target.Num, target.Den);
        Assert.EndsWith("*", path);
        Assert.True(depth >= 1);
        Assert.True(steps >= 1);
        Assert.True(steps <= 64);
    }

    [Fact]
    public void Cancel_Throws()
    {
        using var cts = new CancellationTokenSource();
        cts.Cancel();
        Assert.ThrowsAny<OperationCanceledException>(() => _algo.GenerateTree(4, cts.Token));
    }
}

public class KaratsubaTests
{
    private readonly KaratsubaAlgorithm _algo = new();

    [Theory]
    [InlineData(2, 3, 6)]
    [InlineData(12, 34, 408)]
    [InlineData(999, 999, 998001)]
    [InlineData(123456, 654321, 80779853376)]
    public void Multiply_Known(ulong a, ulong b, ulong expected)
    {
        var product = _algo.Multiply(a, b);
        Assert.Equal(new BigInteger(expected), product);
    }

    [Fact]
    public void Multiply_Large_Matches_BigInteger()
    {
        var x = BigInteger.Parse("123456789012345678901234567890");
        var y = BigInteger.Parse("987654321098765432109876543210");
        var product = _algo.Multiply(x, y);
        Assert.Equal(x * y, product);
    }

    [Fact]
    public void Counters_Uses_Recursive_Calls()
    {
        var counters = new KaratsubaAlgorithm.Counters();
        var x = BigInteger.Parse("123456789012345678");
        var y = BigInteger.Parse("234567890123456789");
        var product = _algo.Multiply(x, y, counters);
        Assert.Equal(x * y, product);
        Assert.True(counters.MultiplyCalls >= 4, $"calls={counters.MultiplyCalls}");
        Assert.True(counters.AddOps > 0);
    }

    [Fact]
    public void Trace_Contains_Schoolbook_Base()
    {
        var log = _algo.TraceMultiply(12345, 67890);
        Assert.NotEmpty(log);
        Assert.Contains(log, l => l.Contains("школ") || l.Contains("Multiply"));
    }

    [Fact]
    public void Cancel_Throws()
    {
        using var cts = new CancellationTokenSource();
        cts.Cancel();
        var x = BigInteger.Parse("12345678901234567890");
        var y = BigInteger.Parse("98765432109876543210");
        Assert.ThrowsAny<OperationCanceledException>(() =>
            _algo.Multiply(x, y, ct: cts.Token));
    }
}

public class IntegerPartitionsExtendedTests
{
    private readonly IntegerPartitionsAlgorithm _algo = new();

    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 1)]
    [InlineData(2, 2)]
    [InlineData(3, 3)]
    [InlineData(4, 5)]
    [InlineData(5, 7)]
    [InlineData(6, 11)]
    [InlineData(7, 15)]
    [InlineData(8, 22)]
    [InlineData(10, 42)]
    public void CountPartitions_Matches_Known_P_n(int n, int expected)
    {
        Assert.Equal(expected, _algo.CountPartitions(n));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    [InlineData(6)]
    public void EnumeratePartitions_AllSumsEqual_N(int n)
    {
        var list = _algo.EnumeratePartitions(n, CancellationToken.None).ToList();
        Assert.Equal(_algo.CountPartitions(n), list.Count);
        foreach (var p in list)
        {
            Assert.Equal(n, p.Sum());
            // Проверка невозрастания a_1 >= a_2 >= ...
            for (int i = 1; i < p.Count; i++)
            {
                Assert.True(p[i - 1] >= p[i], "Части разбиения должны быть упорядочены по невозрастанию.");
            }
        }
    }
}
