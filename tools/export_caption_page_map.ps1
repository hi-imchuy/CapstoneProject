$ErrorActionPreference = "Stop"

$docx = "D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN-da-cap-nhat.docx"
$outJson = "D:\Ki10\CapstoneProject\caption_page_map.json"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
    $doc = $word.Documents.Open($docx, $false, $true)
    $doc.Repaginate()

    $items = New-Object System.Collections.Generic.List[object]
    foreach ($p in $doc.Paragraphs) {
        $text = $p.Range.Text -replace "[`r`a]", ""
        $text = $text.Trim()
        if ([string]::IsNullOrWhiteSpace($text)) { continue }
        if ($text -match "Hình|Bảng") {
            $items.Add([pscustomobject]@{
                text = $text
                page = $p.Range.Information(3)
            })
        }
    }

    $json = $items | ConvertTo-Json -Depth 3
    $json | Out-File -LiteralPath $outJson -Encoding utf8 -Force
    Write-Output ("Caption matches: " + $items.Count)
    $doc.Close($false)
}
finally {
    $word.Quit()
}

Write-Output "Wrote $outJson"
