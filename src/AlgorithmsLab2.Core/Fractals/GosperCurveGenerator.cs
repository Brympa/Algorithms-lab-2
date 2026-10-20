using AlgorithmsLab2.Core.Geometry;

namespace AlgorithmsLab2.Core.Fractals;

/// <summary>
/// Кривая Госпера (flowsnake) — РЕКУРСИВНЫЙ main path (без materialize L-строки).
///
/// Канон (L-system, угол δ = 60°):
///   Axiom: A
///   A → A-B--B+A++AA+B-
///   B → +A-BB--B-A++A+B
///
/// Рекурсия: A(n)/B(n) при n==0 — шаг черепахи; иначе 7 вложенных вызовов.
/// Сегментов A(n) = 7^n. См. также <see cref="LSystem"/> (только для сверки/справки).
/// </summary>
public sealed class GosperCurveGenerator : IFractalGenerator
{
    public string Id => "gosper";
    public string Name => "Кривая Госпера";
    public string Description =>
        "Space-filling кривая на гексагональной решётке (flowsnake). " +
        "Строится рекурсивно: кривая порядка n состоит из 7 кривых порядка n−1 (A/B-подкривые).";
    public int DefaultOrder => 3;
    public int MaxOrder => 6;

    public const float Angle = 60f;
    public const float Step = 1f;

    public FractalGeometry Generate(FractalRequest request, CancellationToken ct = default)
    {
        int order = Math.Clamp(request.Order, 0, 7);
        int segments = SegmentCount(order);

        using var path = new PathBuilder(segments + 2);
        var t = new Turtle(0f, 0f, 0f);
        path.MoveTo(t.X, t.Y);

        DrawA(order, ref t, path, ct);

        return path.Build();
    }

    /// <summary>Число сегментов кривой A(order) = 7^order.</summary>
    public static int SegmentCount(int order)
    {
        if (order < 0)
            throw new ArgumentOutOfRangeException(nameof(order));
        return order == 0 ? 1 : checked((int)Math.Pow(7, order));
    }

    // A → A-B--B+A++AA+B-
    private static void DrawA(int order, ref Turtle t, PathBuilder path, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (order == 0)
        {
            t.Forward(Step, path);
            return;
        }

        int n = order - 1;
        DrawA(n, ref t, path, ct);   // A
        Turn(-1, ref t);             // -
        DrawB(n, ref t, path, ct);   // B
        Turn(-2, ref t);             // --
        DrawB(n, ref t, path, ct);   // B
        Turn(+1, ref t);             // +
        DrawA(n, ref t, path, ct);   // A
        Turn(+2, ref t);             // ++
        DrawA(n, ref t, path, ct);   // A
        DrawA(n, ref t, path, ct);   // A
        Turn(+1, ref t);             // +
        DrawB(n, ref t, path, ct);   // B
        Turn(-1, ref t);             // -
    }

    // B → +A-BB--B-A++A+B
    private static void DrawB(int order, ref Turtle t, PathBuilder path, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (order == 0)
        {
            t.Forward(Step, path);
            return;
        }

        int n = order - 1;
        Turn(+1, ref t);             // +
        DrawA(n, ref t, path, ct);   // A
        Turn(-1, ref t);             // -
        DrawB(n, ref t, path, ct);   // B
        DrawB(n, ref t, path, ct);   // B
        Turn(-2, ref t);             // --
        DrawB(n, ref t, path, ct);   // B
        Turn(-1, ref t);             // -
        DrawA(n, ref t, path, ct);   // A
        Turn(+2, ref t);             // ++
        DrawA(n, ref t, path, ct);   // A
        Turn(+1, ref t);             // +
        DrawB(n, ref t, path, ct);   // B
    }

    /// <summary>Поворот на k шагов по 60°.</summary>
    private static void Turn(int steps, ref Turtle t)
    {
        t.Turn(steps * Angle);
    }
}
