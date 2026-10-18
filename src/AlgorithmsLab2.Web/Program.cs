using AlgorithmsLab2.Core;
using AlgorithmsLab2.Web;
using AlgorithmsLab2.Web.Services;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(_ => new HttpClient
{
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress)
});

// Явная регистрация каталогов (без reflection, PublishTrimmed-safe)
var (fractals, team, hanoi) = AllAlgorithms.CreateDefault();
builder.Services.AddSingleton(fractals);
builder.Services.AddSingleton(team);
builder.Services.AddSingleton(hanoi);
builder.Services.AddSingleton<CatalogState>();
builder.Services.AddScoped<HanoiPlaybackService>();
builder.Services.AddScoped<CanvasRenderService>();

await builder.Build().RunAsync();
