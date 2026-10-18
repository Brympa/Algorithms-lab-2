using AlgorithmsLab2.Core;

namespace AlgorithmsLab2.Web.Services;

/// <summary>Общий доступ к каталогам для страниц (DI).</summary>
public sealed class CatalogState
{
    public CatalogState(FractalCatalog fractals, TeamCatalog team, HanoiCatalog hanoi)
    {
        Fractals = fractals;
        Team = team;
        Hanoi = hanoi;
    }

    public FractalCatalog Fractals { get; }
    public TeamCatalog Team { get; }
    public HanoiCatalog Hanoi { get; }
}
