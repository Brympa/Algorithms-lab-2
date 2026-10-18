namespace AlgorithmsLab2.Core.Meta;

/// <summary>Структурированная сложность алгоритма (не строка).</summary>
public sealed record ComplexityInfo(
    string Display,
    string Best,
    string Average,
    string Worst)
{
    public static ComplexityInfo Unknown { get; } = new("O(?)", "?", "?", "?");

    public static ComplexityInfo Single(string display) =>
        new(display, display, display, display);
}
