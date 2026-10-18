using System.Text;

namespace AlgorithmsLab2.Core.Fractals;

/// <summary>
/// L-система кривой Госпера — ТОЛЬКО для справки и сверки эквивалентности
/// (не main path рендеринга). Main path — рекурсия в <see cref="GosperCurveGenerator"/>.
/// </summary>
public static class LSystem
{
    /// <summary>δ = 60°, axiom = A.</summary>
    public const float AngleDeg = 60f;
    public const string Axiom = "A";

    public static string RewriteA() => "A-B--B+A++AA+B-";
    public static string RewriteB() => "+A-BB--B-A++A+B";

    /// <summary>Раскрытие строки порядка n (n итераций). Осторожно: экспоненциально.</summary>
    public static string Expand(int order)
    {
        if (order < 0)
            throw new ArgumentOutOfRangeException(nameof(order));
        if (order > 6)
            throw new ArgumentOutOfRangeException(nameof(order), "Для справки достаточно n≤6.");

        string s = Axiom;
        for (int i = 0; i < order; i++)
            s = ExpandOnce(s);
        return s;
    }

    public static string ExpandOnce(string current)
    {
        var sb = new StringBuilder(current.Length * 4);
        foreach (char c in current)
        {
            switch (c)
            {
                case 'A':
                    sb.Append(RewriteA());
                    break;
                case 'B':
                    sb.Append(RewriteB());
                    break;
                default:
                    sb.Append(c);
                    break;
            }
        }

        return sb.ToString();
    }

    /// <summary>Число сегментов (символов A/B) в строке порядка n.</summary>
    public static int SegmentCountFromExpand(int order)
    {
        string s = Expand(order);
        int count = 0;
        foreach (char c in s)
        {
            if (c is 'A' or 'B')
                count++;
        }

        return count;
    }
}
