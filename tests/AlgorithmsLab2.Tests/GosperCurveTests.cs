using AlgorithmsLab2.Core.Fractals;
using AlgorithmsLab2.Core.Geometry;

namespace AlgorithmsLab2.Tests;

public class GosperCurveTests
{
    private readonly GosperCurveGenerator _gen = new();

    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 7)]
    [InlineData(2, 49)]
    [InlineData(3, 343)]
    [InlineData(4, 2401)]
    [InlineData(5, 16807)]
    public void SegmentCount_7_pow_n(int order, int expected)
    {
        Assert.Equal(expected, GosperCurveGenerator.SegmentCount(order));
        Assert.Equal(expected, LSystem.SegmentCountFromExpand(order));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    public void Generate_PointCount_Is_Segments_Plus_Start(int order)
    {
        var g = _gen.Generate(new FractalRequest(order));
        int segments = GosperCurveGenerator.SegmentCount(order);
        Assert.Equal(segments + 1, g.PointCount);
        Assert.Equal(segments * 2 + 2, g.Xy.Length);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    public void Bounds_Finite_And_NonEmpty(int order)
    {
        var g = _gen.Generate(new FractalRequest(order));
        var b = g.Bounds;

        Assert.False(float.IsNaN(b.MinX) || float.IsNaN(b.MinY) ||
                     float.IsNaN(b.MaxX) || float.IsNaN(b.MaxY));
        Assert.False(float.IsInfinity(b.MinX) || float.IsInfinity(b.MinY) ||
                     float.IsInfinity(b.MaxX) || float.IsInfinity(b.MaxY));
        Assert.True(b.Width >= 0 && b.Height >= 0);
        Assert.True(g.PointCount >= 2);
    }

    /// <summary>Golden: order=1, канон A→A-B--B+A++AA+B-, δ=60°, step=1, старт (0,0), угол 0.</summary>
    [Fact]
    public void Golden_Polyline_Order1()
    {
        var g = _gen.Generate(new FractalRequest(1));
        Assert.Equal(8, g.PointCount);

        float s3 = MathF.Sqrt(3f);
        float[][] expected =
        {
            new[] { 0f, 0f },
            new[] { 1f, 0f },
            new[] { 1.5f, -s3 / 2f },
            new[] { 0.5f, -s3 / 2f },
            new[] { 0f, -s3 },
            new[] { 1f, -s3 },
            new[] { 2f, -s3 },
            new[] { 2.5f, -s3 / 2f },
        };

        var xy = g.Xy.Span;
        for (int i = 0; i < expected.Length; i++)
        {
            Assert.Equal(expected[i][0], xy[i * 2], 5);
            Assert.Equal(expected[i][1], xy[i * 2 + 1], 5);
        }
    }

    /// <summary>Golden: старт/финиш и смещение центра масс — стабильны для order=2.</summary>
    [Fact]
    public void Golden_Endpoints_Order2()
    {
        var g = _gen.Generate(new FractalRequest(2));
        var xy = g.Xy.Span;
        int last = (g.PointCount - 1) * 2;

        // Старт
        Assert.Equal(0f, xy[0], 5);
        Assert.Equal(0f, xy[1], 5);

        // Финиш A(2) совпадает с L-интерпретацией (см. Recursive_Equals_LSystem_Turtle).
        var viaString = InterpretLSystem(LSystem.Expand(2));
        Assert.Equal(viaString[^1].x, xy[last], 5);
        Assert.Equal(viaString[^1].y, xy[last + 1], 5);

        // Центр масс не вырождается
        double sx = 0, sy = 0;
        for (int i = 0; i < xy.Length; i += 2)
        {
            sx += xy[i];
            sy += xy[i + 1];
        }

        int n = g.PointCount;
        double cx = sx / n, cy = sy / n;
        Assert.False(double.IsNaN(cx) || double.IsNaN(cy));
        Assert.True(Math.Abs(cx) + Math.Abs(cy) > 0.1);
    }

    /// <summary>Рекурсия и L-строка дают одинаковые координаты (эквивалентность main path).</summary>
    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    public void Recursive_Equals_LSystem_Turtle(int order)
    {
        var recursive = _gen.Generate(new FractalRequest(order));
        var viaString = InterpretLSystem(LSystem.Expand(order));

        Assert.Equal(recursive.PointCount, viaString.Count);

        var span = recursive.Xy.Span;
        for (int i = 0; i < viaString.Count; i++)
        {
            Assert.Equal(viaString[i].x, span[i * 2], 5);
            Assert.Equal(viaString[i].y, span[i * 2 + 1], 5);
        }
    }

    [Fact]
    public void Cancel_Throws()
    {
        using var cts = new CancellationTokenSource();
        cts.Cancel();
        Assert.ThrowsAny<OperationCanceledException>(() =>
            _gen.Generate(new FractalRequest(4), cts.Token));
    }

    [Fact]
    public void MaxOrder_Is_5_For_Demo()
    {
        Assert.Equal(5, _gen.MaxOrder);
    }

    private static List<(float x, float y)> InterpretLSystem(string commands)
    {
        var points = new List<(float x, float y)> { (0f, 0f) };
        float x = 0, y = 0, angle = 0;
        const float step = GosperCurveGenerator.Step;
        const float angleStep = GosperCurveGenerator.Angle;

        foreach (char c in commands)
        {
            switch (c)
            {
                case 'A':
                case 'B':
                {
                    float rad = angle * (MathF.PI / 180f);
                    x += MathF.Cos(rad) * step;
                    y += MathF.Sin(rad) * step;
                    points.Add((x, y));
                    break;
                }
                case '+':
                    angle += angleStep;
                    break;
                case '-':
                    angle -= angleStep;
                    break;
            }
        }

        return points;
    }
}
