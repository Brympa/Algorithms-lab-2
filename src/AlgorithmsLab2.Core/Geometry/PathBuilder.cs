using System.Buffers;

namespace AlgorithmsLab2.Core.Geometry;

/// <summary>Накопление точек пути (x,y) без UI.</summary>
public sealed class PathBuilder : IDisposable
{
    private float[] _buffer;
    private int _length;

    public PathBuilder(int capacityPoints = 1024)
    {
        if (capacityPoints < 1) capacityPoints = 1;
        _buffer = ArrayPool<float>.Shared.Rent(capacityPoints * 2);
        _length = 0;
    }

    public int PointCount => _length / 2;

    public void MoveTo(float x, float y) => Add(x, y);

    public void LineTo(float x, float y) => Add(x, y);

    public void Add(float x, float y)
    {
        if (_length + 2 > _buffer.Length)
        {
            int newCap = Math.Max(_buffer.Length * 2, _length + 2);
            float[] next = ArrayPool<float>.Shared.Rent(newCap);
            Array.Copy(_buffer, next, _length);
            ArrayPool<float>.Shared.Return(_buffer);
            _buffer = next;
        }

        _buffer[_length++] = x;
        _buffer[_length++] = y;
    }

    public FractalGeometry Build()
    {
        var xy = new float[_length];
        Array.Copy(_buffer, xy, _length);
        return new FractalGeometry
        {
            Xy = xy,
            Bounds = Bounds.FromXy(xy)
        };
    }

    public void Dispose()
    {
        if (_buffer.Length > 0)
        {
            ArrayPool<float>.Shared.Return(_buffer);
            _buffer = Array.Empty<float>();
            _length = 0;
        }
    }
}
