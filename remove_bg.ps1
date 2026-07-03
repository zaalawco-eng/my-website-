Add-Type -AssemblyName System.Drawing

$dir = $PSScriptRoot
$pngFiles = Get-ChildItem -Path $dir -Filter "*.png"
$inputFile = $pngFiles[0].FullName
$outputFile = Join-Path $dir "assets\images\logo.png"

Write-Host "Input File: $inputFile"
Write-Host "Output File: $outputFile"

$code = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;

public class LogoProcessor {
    public static void RemoveWhiteBackground(string inputPath, string outputPath) {
        Bitmap bmp = new Bitmap(inputPath);
        Bitmap output = new Bitmap(bmp.Width, bmp.Height, PixelFormat.Format32bppArgb);
        for (int y = 0; y < bmp.Height; y++) {
            for (int x = 0; x < bmp.Width; x++) {
                Color c = bmp.GetPixel(x, y);
                int minVal = Math.Min(c.R, Math.Min(c.G, c.B));
                int maxVal = Math.Max(c.R, Math.Max(c.G, c.B));
                
                if (minVal > 210) {
                    output.SetPixel(x, y, Color.Transparent);
                } else if (minVal > 180 && maxVal > 210) {
                    int alpha = (int)(255 * (210 - minVal) / 30.0f);
                    if (alpha < 0) alpha = 0;
                    if (alpha > 255) alpha = 255;
                    output.SetPixel(x, y, Color.FromArgb(alpha, c.R, c.G, c.B));
                } else {
                    output.SetPixel(x, y, c);
                }
            }
        }
        output.Save(outputPath, ImageFormat.Png);
        bmp.Dispose();
        output.Dispose();
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[LogoProcessor]::RemoveWhiteBackground($inputFile, $outputFile)
Write-Host "Logo background removed successfully!"
