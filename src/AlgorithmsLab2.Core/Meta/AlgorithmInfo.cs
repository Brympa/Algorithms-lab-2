namespace AlgorithmsLab2.Core.Meta;

/// <summary>Справка по алгоритму (блок как в лаб. 1).</summary>
public sealed record AlgorithmInfo(
    string Name,
    string Description,
    string PracticalApplication,
    ComplexityInfo Complexity,
    IReadOnlyList<string> Sources);
