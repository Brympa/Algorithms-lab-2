namespace AlgorithmsLab2.Core.Fractals;

/// <summary>Черепаха для L-system / рекурсивных кривых (без UI).</summary>
public ref struct Turtle
{
    public float X;
    public float Y;
    public float AngleDeg;

    public Turtle(float x, float y, float angleDeg)
    {
        X = x;
        Y = y;
        AngleDeg = angleDeg;
    }

    public void Turn(float deltaDeg) => AngleDeg += deltaDeg;

    public void Forward(float distance, Geometry.PathBuilder path)
    {
        float rad = AngleDeg * (MathF.PI / 180f);
        float nx = X + MathF.Cos(rad) * distance;
        float ny = Y + MathF.Sin(rad) * distance;
        path.LineTo(nx, ny);
        X = nx;
        Y = ny;
    }
}
