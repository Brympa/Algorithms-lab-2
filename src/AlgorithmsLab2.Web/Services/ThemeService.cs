using Microsoft.JSInterop;

namespace AlgorithmsLab2.Web.Services;

/// <summary>
/// Управление цветовой темой приложения (тёмная / светлая) с сохранением в localStorage
/// и синхронизацией с CSS-переменными без мигания интерфейса.
/// </summary>
public sealed class ThemeService
{
    private readonly IJSRuntime _js;
    private bool _isLight;

    public bool IsLight => _isLight;
    public string CurrentTheme => _isLight ? "light" : "dark";

    public event Action? ThemeChanged;

    public ThemeService(IJSRuntime js)
    {
        _js = js;
        if (js is IJSInProcessRuntime inProc)
        {
            try
            {
                var theme = inProc.Invoke<string>("themeManager.getTheme");
                _isLight = string.Equals(theme, "light", StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                // Fallback if called before JS is ready
            }
        }
    }

    public async Task InitializeAsync()
    {
        try
        {
            var theme = await _js.InvokeAsync<string>("themeManager.getTheme");
            var isLight = string.Equals(theme, "light", StringComparison.OrdinalIgnoreCase);
            if (_isLight != isLight)
            {
                _isLight = isLight;
                ThemeChanged?.Invoke();
            }
        }
        catch (JSException)
        {
        }
    }

    public async Task ToggleThemeAsync()
    {
        try
        {
            var newTheme = await _js.InvokeAsync<string>("themeManager.toggleTheme");
            _isLight = string.Equals(newTheme, "light", StringComparison.OrdinalIgnoreCase);
            ThemeChanged?.Invoke();
        }
        catch (JSException)
        {
            _isLight = !_isLight;
            ThemeChanged?.Invoke();
        }
    }

    public async Task SetThemeAsync(string theme)
    {
        try
        {
            await _js.InvokeVoidAsync("themeManager.setTheme", theme);
            _isLight = string.Equals(theme, "light", StringComparison.OrdinalIgnoreCase);
            ThemeChanged?.Invoke();
        }
        catch (JSException)
        {
        }
    }
}
