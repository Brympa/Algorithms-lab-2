using AlgorithmsLab2.Core.Meta;

namespace AlgorithmsLab2.Core.Team;

public interface ITeamAlgorithm
{
    string Id { get; }
    /// <summary>"main" | "slot-b" | "slot-c"</summary>
    string Slot { get; }
    string Name { get; }
    string Description { get; }
    string PracticalApplication { get; }
    ComplexityInfo Complexity { get; }
    IReadOnlyList<string> Sources { get; }

    bool IsReady { get; }
}
