using AlgorithmsLab2.Core.Geometry;

namespace AlgorithmsLab2.Core.Fractals;

/// <summary>
/// Кривая Госпера (flowsnake) — РЕКУРСИВНЫЙ генератор (main path, без L-строки).
/// При order==0 — один шаг; иначе 7 рекурсивных вызовов подкривых, угол 60°.
/// Сегментов: 7^order.
/// </summary>
public sealed class GosperCurveGenerator : IFractalGenerator
{
    public string Id => "gosper";
    public string Name => "Кривая Госпера";
    public string Description =>
        "Space-filling кривая на гексагональной решётке (flowsnake). " +
        "Строится рекурсивно: кривая порядка n состоит из 7 кривых порядка n−1.";
    public int DefaultOrder => 3;
    /// <summary>Hard-cap для UI-демо (6 — только вручную).</summary>
    public int MaxOrder => 5;

    private const float Angle = 60f;
    private const float Step = 1f;

    public FractalGeometry Generate(FractalRequest request, CancellationToken ct = default)
    {
        int order = Math.Clamp(request.Order, 0, 6);
        int segments = order == 0 ? 1 : (int)Math.Pow(7, order);

        using var path = new PathBuilder(Math.Min(segments + 2, 1 << 20));
        var t = new Turtle(0f, 0f, 0f);
        path.MoveTo(t.X, t.Y);

        Draw(order, ref t, path, ct);

        return path.Build();
    }

    /// <summary>
    /// Рекурсивная кривая Госпера.
    /// A = -B++A++B-- (схема подкривых); эквивалентно 7 вложенным вызовам.
    /// </summary>
    private static void Draw(int order, ref Turtle t, PathBuilder path, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (order == 0)
        {
            t.Forward(Step, path);
            return;
        }

        // Каноническая развёртка flowsnake (7 подкривых):
        // A: -B++A++B------
        // B: +A----B++++A-
        // Рекурсивный обход без materialize строки.
        DrawA(order, ref t, path, ct);
    }

    private static void DrawA(int order, ref Turtle t, PathBuilder path, CancellationToken ct)
    {
        if (order == 0)
        {
            t.Forward(Step, path);
            return;
        }

        // A → - B + + A + + B - -
        t.Turn(-Angle);
        DrawB(order - 1, ref t, path, ct);
        t.Turn(Angle);
        t.Turn(Angle);
        DrawA(order - 1, ref t, path, ct);
        t.Turn(Angle);
        t.Turn(Angle);
        DrawB(order - 1, ref t, path, ct);
        t.Turn(-Angle);
        t.Turn(-Angle);
    }

    private static void DrawB(int order, ref Turtle t, PathBuilder path, CancellationToken ct)
    {
        if (order == 0)
        {
            t.Forward(Step, path);
            return;
        }

        // B → + A - - - - B + + + + A -
        t.Turn(Angle);
        DrawA(order - 1, ref t, path, ct);
        t.Turn(-Angle);
        t.Turn(-Angle);
        t.Turn(-Angle);
        t.Turn(-Angle);
        DrawB(order - 1, ref t, path, ct);
        t.Turn(Angle);
        t.Turn(Angle);
        t.Turn(Angle);
        t.Turn(Angle);
        DrawA(order - 1, ref t, path, ct);
        t.Turn(-Angle);
    }
}
