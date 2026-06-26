$ErrorActionPreference = "Stop"

$docx = "D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN-da-cap-nhat.docx"
$outJson = "D:\Ki10\CapstoneProject\docx_page_map.json"
$outPdf = "D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN-da-cap-nhat.pdf"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
    $doc = $word.Documents.Open($docx, $false, $false)
    $doc.Repaginate()
    $doc.Fields.Update() | Out-Null
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() | Out-Null }
    foreach ($tof in $doc.TablesOfFigures) { $tof.Update() | Out-Null }
    $doc.Repaginate()

    $items = New-Object System.Collections.Generic.List[object]
    $inBody = $false
    $seenFrontMatterLists = $false
    foreach ($p in $doc.Paragraphs) {
        $text = $p.Range.Text -replace "[`r`a]", ""
        $text = $text.Trim()
        if ([string]::IsNullOrWhiteSpace($text)) { continue }
        if ($text -eq "DANH MỤC BẢNG BIỂU") { $seenFrontMatterLists = $true }
        if ($seenFrontMatterLists -and $text -eq "MỞ ĐẦU") { $inBody = $true }
        if (-not $inBody) { continue }
        if (
            $text -match "^(MỞ ĐẦU|CHƯƠNG\s+\d+:|KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN|TÀI LIỆU THAM KHẢO)$" -or
            $text -match "^\d+(\.\d+)*\.\s+" -or
            $text -match "^Hình\s+\d+\.\d+:" -or
            $text -match "^Bảng\s+\d+\.\d+\."
        ) {
            $items.Add([pscustomobject]@{
                text = $text
                page = $p.Range.Information(3)
            })
        }
    }

    $items | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $outJson -Encoding UTF8
    $doc.ExportAsFixedFormat($outPdf, 17)
    $doc.Save()
    $doc.Close()
}
finally {
    $word.Quit()
}

Write-Output "Wrote $outJson"
Write-Output "Wrote $outPdf"
