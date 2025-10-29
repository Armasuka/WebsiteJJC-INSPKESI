# Script untuk mengganti emoticon dengan icon text yang lebih profesional
$files = Get-ChildItem -Path "app/dashboard" -Include *.tsx -Recurse

$replacements = @{
    '📋' = 'Status'
    '📝' = 'Dokumen'
    '👔' = ''
    '✅' = '✓'
    '⏳' = ''
    '❌' = '✗'
    '💾' = ''
    '📊' = 'Laporan'
    '➕' = '+'
    '🏢' = 'Plaza'
    '🚚' = 'Derek'
    '🛡️' = 'Kamtib'
    '🚒' = 'Rescue'
    '📅' = ''
    'ℹ️' = 'Info:'
    '🔍' = ''
    '1️⃣' = '1.'
    '2️⃣' = '2.'
    '3️⃣' = '3.'
    '4️⃣' = '4.'
    '5️⃣' = '5.'
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    foreach ($emoji in $replacements.Keys) {
        $replacement = $replacements[$emoji]
        $content = $content -replace [regex]::Escape($emoji), $replacement
    }
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nEmoticon replacement complete!" -ForegroundColor Cyan
