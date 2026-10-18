using AlgorithmsLab2.Core.Fractals;
using AlgorithmsLab2.Core.Hanoi;
using AlgorithmsLab2.Core.Team;

namespace AlgorithmsLab2.Core;

/// <summary>
/// Точные каталоги (без generic-god и без reflection — совместимо с PublishTrimmed).
/// </summary>
public sealed class FractalCatalog
{
    private readonly Dictionary<string, IFractalGenerator> _map = new(StringComparer.OrdinalIgnoreCase);

    public void Register(IFractalGenerator item) => _map[item.Id] = item;

    public IFractalGenerator? Get(string id) => _map.GetValueOrDefault(id);

    public IReadOnlyList<IFractalGenerator> GetAll() => _map.Values.ToList();
}

public sealed class HanoiCatalog
{
    private readonly Dictionary<string, IHanoiSolver> _map = new(StringComparer.OrdinalIgnoreCase);

    public void Register(IHanoiSolver item) => _map[item.Id] = item;

    public IHanoiSolver? Get(string id) => _map.GetValueOrDefault(id);

    public IReadOnlyList<IHanoiSolver> GetAll() => _map.Values.ToList();
}

public sealed class TeamCatalog
{
    private readonly Dictionary<string, ITeamAlgorithm> _map = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, IRecursiveAlgorithm> _runners = new(StringComparer.OrdinalIgnoreCase);

    public void Register(ITeamAlgorithm item) => _map[item.Id] = item;

    public void RegisterRunner(IRecursiveAlgorithm runner) => _runners[runner.AlgorithmId] = runner;

    /// <summary>Регистрирует мета + runner одним классом.</summary>
    public void Register(ITeamAlgorithm item, IRecursiveAlgorithm runner)
    {
        Register(item);
        RegisterRunner(runner);
    }

    public ITeamAlgorithm? Get(string id) => _map.GetValueOrDefault(id);

    public IRecursiveAlgorithm? GetRunner(string algorithmId) => _runners.GetValueOrDefault(algorithmId);

    public IReadOnlyList<ITeamAlgorithm> GetAll() => _map.Values.ToList();
}
