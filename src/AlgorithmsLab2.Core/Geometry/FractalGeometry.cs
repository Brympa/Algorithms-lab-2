namespace AlgorithmsLab2.Core.Geometry;

/// <summary>
/// Единая геометрия пути: чередование x0,y0,x1,y1,… + bounding box.
/// Передаётся в JS как Float32Array (никакого JSON-батча).
/// </summary>
public sealed class FractalGeometry
{
    public required ReadOnlyMemory<float> Xy { get; init; }
    public required Bounds Bounds { get; init; }
    public int PointCount => Xy.Length / 2;
}

public readonly record struct Bounds(float MinX, float MinY, float MaxX, float MaxY)
{
    public float Width => MaxX - MinX;
    public float Height => MaxY - MinY;

    public static Bounds FromXy(ReadOnlySpan<float> xy)
    {
        if (xy.Length < 2)
            return new Bounds(0, 0, 0, 0);

        float minX = float.MaxValue, minY = float.MaxValue;
        float maxX = float.MinValue, maxY = float.MinValue;

        for (int i = 0; i + 1 < xy.Length; i += 2)
        {
            float x = xy[i], y = xy[i + 1];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        return new Bounds(minX, minY, maxX, maxY);
    }
}
