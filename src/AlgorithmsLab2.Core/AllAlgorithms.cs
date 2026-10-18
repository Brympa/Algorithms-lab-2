using AlgorithmsLab2.Core.Fractals;
using AlgorithmsLab2.Core.Hanoi;
using AlgorithmsLab2.Core.Team;
using AlgorithmsLab2.Core.Team.Algorithms;

namespace AlgorithmsLab2.Core;

/// <summary>
/// Единственная точка регистрации (без reflection — PublishTrimmed-safe).
/// Новый алгоритм = класс + одна строка здесь.
/// </summary>
public static class AllAlgorithms
{
    public static void Register(
        FractalCatalog fractals,
        TeamCatalog team,
        HanoiCatalog hanoi)
    {
        fractals.Register(new GosperCurveGenerator());

        hanoi.Register(new RecursiveHanoiSolver());
        hanoi.Register(new StackHanoiSolver());

        // main — готовый алгоритм
        var partitions = new IntegerPartitionsAlgorithm();
        team.Register(partitions, partitions);

        // slot-b / slot-c — стабы на доработку участниками
        var slotB = new TeamAlgorithmSlotB();
        team.Register(slotB, slotB);

        var slotC = new TeamAlgorithmSlotC();
        team.Register(slotC, slotC);
    }

    public static (FractalCatalog Fractals, TeamCatalog Team, HanoiCatalog Hanoi) CreateDefault()
    {
        var fractals = new FractalCatalog();
        var team = new TeamCatalog();
        var hanoi = new HanoiCatalog();
        Register(fractals, team, hanoi);
        return (fractals, team, hanoi);
    }
}
