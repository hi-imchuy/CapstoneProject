$ErrorActionPreference = "Stop"

$docx = "D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN.docx"
$pdf = "D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN-original-readonly.pdf"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
    $doc = $word.Documents.Open($docx, $false, $true)
    $doc.Repaginate()
    $doc.ExportAsFixedFormat($pdf, 17)
    $doc.Close($false)
}
finally {
    $word.Quit()
}

Write-Output $pdf
