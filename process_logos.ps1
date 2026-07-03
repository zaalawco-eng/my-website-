Add-Type -AssemblyName System.Drawing

$dir = $PSScriptRoot
$pngFiles = Get-ChildItem -Path $dir -Filter "*.png" | Where-Object { $_.Name -like "*شعار*" -or $_.Name -like "*logo*" }
if (-not $pngFiles) {
    $pngFiles = Get-ChildItem -Path $dir -Filter "*.png"
}
$inputFile = $pngFiles[0].FullName
$outputDark = Join-Path $dir "assets\images\logo-dark.png"
$outputLight = Join-Path $dir "assets\images\logo-light.png"
$outputOld = Join-Path $dir "assets\images\logo.png"

Write-Host "Input File: $inputFile"

$code = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;

public class DualLogoProcessor {
    public static void ProcessLogos(string inputPath, string outputDarkPath, string outputLightPath, string outputOldPath) {
        Bitmap bmp = new Bitmap(inputPath);
        Bitmap darkOutput = new Bitmap(bmp.Width, bmp.Height, PixelFormat.Format32bppArgb);
        Bitmap lightOutput = new Bitmap(bmp.Width, bmp.Height, PixelFormat.Format32bppArgb);

        for (int y = 0; y < bmp.Height; y++) {
            for (int x = 0; x < bmp.Width; x++) {
                Color c = bmp.GetPixel(x, y);
                int minVal = Math.Min(c.R, Math.Min(c.G, c.B));
                int maxVal = Math.Max(c.R, Math.Max(c.G, c.B));
                
                // Remove white/textured background
                if (minVal > 210) {
                    darkOutput.SetPixel(x, y, Color.Transparent);
                    lightOutput.SetPixel(x, y, Color.Transparent);
                } else {
                    Color finalDark = c;
                    if (minVal > 180 && maxVal > 210) {
                        int alpha = (int)(255 * (210 - minVal) / 30.0f);
                        if (alpha < 0) alpha = 0;
                        if (alpha > 255) alpha = 255;
                        finalDark = Color.FromArgb(alpha, c.R, c.G, c.B);
                    }
                    darkOutput.SetPixel(x, y, finalDark);

                    // For light output: if it's gold (R > 130 and R is significantly higher than B), keep it.
                    // Otherwise it's navy text -> turn to bright white/ivory (255, 253, 250).
                    Color finalLight = finalDark;
                    if ((c.R - c.B > 40) && c.R > 120) {
                        // Gold scale - keep intact
                        finalLight = finalDark;
                    } else {
                        // Navy text - make bright ivory/white with same alpha
                        finalLight = Color.FromArgb(finalDark.A, 255, 253, 250);
                    }
                    lightOutput.SetPixel(x, y, finalLight);
                }
            }
        }
        darkOutput.Save(outputDarkPath, ImageFormat.Png);
        darkOutput.Save(outputOldPath, ImageFormat.Png); // overwrite logo.png just in case
        lightOutput.Save(outputLightPath, ImageFormat.Png);

        bmp.Dispose();
        darkOutput.Dispose();
        lightOutput.Dispose();
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[DualLogoProcessor]::ProcessLogos($inputFile, $outputDark, $outputLight, $outputOld)
Write-Host "Logos processed successfully! Created logo-dark.png and logo-light.png without any background."
