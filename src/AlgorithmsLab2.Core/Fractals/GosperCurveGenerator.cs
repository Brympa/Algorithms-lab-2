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
    public int MaxOrder => 100;

    public const float Angle = 60f;
    public const float Step = 1f;

    public FractalGeometry Generate(FractalRequest request, CancellationToken ct = default)
    {
        // Для рендеринга на экране геометрия порядка 7 уже имеет 823 543 точки (<0.05px на сегмент),
        // что обеспечивает предельную субпиксельную детализацию без OOM для n до 100.
        int effectiveOrder = Math.Clamp(request.Order, 0, 7);
        int segments = SegmentCount(effectiveOrder);

        using var path = new PathBuilder(segments + 2);
        var t = new Turtle(0f, 0f, 0f);
        path.MoveTo(t.X, t.Y);

        DrawA(effectiveOrder, ref t, path, ct);

        return path.Build();
    }

    /// <summary>Число сегментов кривой A(order) = 7^order (clamped to int.MaxValue for order > 10).</summary>
    public static int SegmentCount(int order)
    {
        if (order < 0)
            throw new ArgumentOutOfRangeException(nameof(order));
        if (order > 10)
            return int.MaxValue;
        return order == 0 ? 1 : checked((int)Math.Pow(7, order));
    }

    /// <summary>Точное число сегментов в BigInteger: 7^order для любого order до 100.</summary>
    public static System.Numerics.BigInteger BigSegmentCount(int order)
    {
        if (order < 0)
            throw new ArgumentOutOfRangeException(nameof(order));
        return order == 0 ? 1 : System.Numerics.BigInteger.Pow(7, order);
    }

    /// <summary>Форматированное строковое представление числа сегментов (с экспоненциальной записью для n > 11).</summary>
    public static string FormatSegmentCount(int order)
    {
        if (order < 0)
            return "0";
        if (order <= 11)
        {
            long val = order == 0 ? 1 : (long)Math.Pow(7, order);
            return val.ToString("N0");
        }

        // 7^N в научной нотации: 7^100 ≈ 3.23 × 10⁸⁴
        double log10 = order * Math.Log10(7);
        double exp = Math.Floor(log10);
        double mantissa = Math.Pow(10, log10 - exp);
        return $"{mantissa:0.00} × 10^{exp:0}";
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
