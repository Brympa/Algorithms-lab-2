using System.Runtime.CompilerServices;
using AlgorithmsLab2.Core.Meta;

namespace AlgorithmsLab2.Core.Team.Algorithms;

/// <summary>
/// СТАБ B — каркас на доработку участником B.
/// Заполните Name/Description/PracticalApplication/Complexity/Sources
/// и реализуйте RunAsync + DemoAsync. Контракты и UI не менять.
/// </summary>
public sealed class TeamAlgorithmSlotB : ITeamAlgorithm, IRecursiveAlgorithm
{
    public string Id => "team-slot-b";
    public string Slot => "slot-b";
    public string Name => "Слот B — рекурсивный алгоритм (TODO)";
    public string Description => "TODO: описание принципа работы (1–2 предложения).";
    public string PracticalApplication => "TODO: практическое применение.";
    public ComplexityInfo Complexity => ComplexityInfo.Unknown;
    public IReadOnlyList<string> Sources => Array.Empty<string>();
    public bool IsReady => false;
    public string AlgorithmId => Id;

    public async IAsyncEnumerable<BenchmarkPoint> RunAsync(
        BenchmarkRequest request,
        [EnumeratorCancellation] CancellationToken ct)
    {
        await Task.Yield();
        ct.ThrowIfCancellationRequested();
        // TODO: рекурсивный алгоритм + замер (см. IntegerPartitionsAlgorithm / _TEMPLATE.md)
        throw new NotImplementedException("Слот B: реализуйте алгоритм (RunAsync).");
#pragma warning disable CS0162
        yield break;
#pragma warning restore CS0162
    }

    public async IAsyncEnumerable<TraceStep> DemoAsync(
        DemoRequest request,
        [EnumeratorCancellation] CancellationToken ct)
    {
        await Task.Yield();
        ct.ThrowIfCancellationRequested();
        // TODO: пошаговое демо
        throw new NotImplementedException("Слот B: реализуйте демо (DemoAsync).");
#pragma warning disable CS0162
        yield break;
#pragma warning restore CS0162
    }
}
