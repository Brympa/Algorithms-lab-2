using AlgorithmsLab2.Core.Geometry;

namespace AlgorithmsLab2.Core.Fractals;

public sealed record FractalRequest(int Order)
{
    public static FractalRequest Default { get; } = new(3);
}

public interface IFractalGenerator
{
    string Id { get; }
    string Name { get; }
    string Description { get; }
    int DefaultOrder { get; }
    /// <summary>Максимальный порядок кривой (до 100).</summary>
    int MaxOrder { get; }

    /// <summary>Рекурсивная генерация пути. Не materialize L-строки.</summary>
    FractalGeometry Generate(FractalRequest request, CancellationToken ct = default);
}
