$files = @(
  "app\jobs\index.tsx",
  "app\jobs\dashboard.tsx",
  "app\jobs\onboarding.tsx",
  "app\jobs\verification.tsx",
  "app\jobs\create.tsx",
  "app\jobs\create-step2.tsx",
  "app\jobs\create-step3.tsx",
  "app\jobs\create-step4.tsx",
  "app\jobs\drivers\index.tsx",
  "app\jobs\drivers\[id].tsx",
  "src\components\jobs\VerificationBanner.tsx",
  "src\components\jobs\JobBadge.tsx",
  "src\components\jobs\LicenseChips.tsx",
  "src\components\jobs\RatingBadges.tsx",
  "src\components\jobs\StatusPill.tsx",
  "src\components\cards\ProposalCard.tsx"
)

foreach ($file in $files) {
  if (-not (Test-Path $file)) { Write-Host "SKIP (not found): $file"; continue }
  $c = Get-Content $file -Raw

  # Radius
  $c = $c -replace 'borderRadius: 16\b',   'borderRadius: Radius.lg'
  $c = $c -replace 'borderRadius: 12\b',   'borderRadius: Radius.md'
  $c = $c -replace 'borderRadius: 8\b',    'borderRadius: Radius.sm'
  $c = $c -replace 'borderRadius: 9999\b', 'borderRadius: Radius.pill'
  $c = $c -replace 'borderRadius: 100\b',  'borderRadius: Radius.pill'
  $c = $c -replace 'borderRadius: 24\b',   'borderRadius: Radius.pill'
  $c = $c -replace 'borderRadius: 20\b',   'borderRadius: Radius.pill'
  $c = $c -replace 'borderRadius: 28\b',   'borderRadius: Radius.xl'

  # Padding (exact)
  $c = $c -replace 'padding: 24\b',            'padding: Spacing.space6'
  $c = $c -replace 'padding: 20\b',            'padding: Spacing.space5'
  $c = $c -replace 'padding: 16\b',            'padding: Spacing.space4'
  $c = $c -replace 'padding: 12\b',            'padding: Spacing.space3'
  $c = $c -replace 'padding: 8\b',             'padding: Spacing.space2'
  $c = $c -replace 'padding: 4\b',             'padding: Spacing.space1'

  $c = $c -replace 'paddingVertical: 24\b',    'paddingVertical: Spacing.space6'
  $c = $c -replace 'paddingVertical: 20\b',    'paddingVertical: Spacing.space5'
  $c = $c -replace 'paddingVertical: 16\b',    'paddingVertical: Spacing.space4'
  $c = $c -replace 'paddingVertical: 12\b',    'paddingVertical: Spacing.space3'
  $c = $c -replace 'paddingVertical: 8\b',     'paddingVertical: Spacing.space2'
  $c = $c -replace 'paddingVertical: 4\b',     'paddingVertical: Spacing.space1'
  $c = $c -replace 'paddingVertical: 5\b',     'paddingVertical: 5'

  $c = $c -replace 'paddingHorizontal: 24\b',  'paddingHorizontal: Spacing.space6'
  $c = $c -replace 'paddingHorizontal: 20\b',  'paddingHorizontal: Spacing.space5'
  $c = $c -replace 'paddingHorizontal: 16\b',  'paddingHorizontal: Spacing.space4'
  $c = $c -replace 'paddingHorizontal: 12\b',  'paddingHorizontal: Spacing.space3'
  $c = $c -replace 'paddingHorizontal: 8\b',   'paddingHorizontal: Spacing.space2'
  $c = $c -replace 'paddingHorizontal: 4\b',   'paddingHorizontal: Spacing.space1'

  # Margin
  $c = $c -replace 'marginBottom: 32\b',       'marginBottom: Spacing.space8'
  $c = $c -replace 'marginBottom: 24\b',       'marginBottom: Spacing.space6'
  $c = $c -replace 'marginBottom: 20\b',       'marginBottom: Spacing.space5'
  $c = $c -replace 'marginBottom: 16\b',       'marginBottom: Spacing.space4'
  $c = $c -replace 'marginBottom: 12\b',       'marginBottom: Spacing.space3'
  $c = $c -replace 'marginBottom: 8\b',        'marginBottom: Spacing.space2'
  $c = $c -replace 'marginBottom: 4\b',        'marginBottom: Spacing.space1'
  $c = $c -replace 'marginTop: 32\b',          'marginTop: Spacing.space8'
  $c = $c -replace 'marginTop: 24\b',          'marginTop: Spacing.space6'
  $c = $c -replace 'marginTop: 20\b',          'marginTop: Spacing.space5'
  $c = $c -replace 'marginTop: 16\b',          'marginTop: Spacing.space4'
  $c = $c -replace 'marginTop: 12\b',          'marginTop: Spacing.space3'
  $c = $c -replace 'marginTop: 8\b',           'marginTop: Spacing.space2'
  $c = $c -replace 'marginTop: 4\b',           'marginTop: Spacing.space1'

  # Gap
  $c = $c -replace 'gap: 32\b',               'gap: Spacing.space8'
  $c = $c -replace 'gap: 24\b',               'gap: Spacing.space6'
  $c = $c -replace 'gap: 20\b',               'gap: Spacing.space5'
  $c = $c -replace 'gap: 16\b',               'gap: Spacing.space4'
  $c = $c -replace 'gap: 12\b',               'gap: Spacing.space3'
  $c = $c -replace 'gap: 8\b',                'gap: Spacing.space2'
  $c = $c -replace 'gap: 4\b',                'gap: Spacing.space1'

  $c | Set-Content $file -NoNewline
  Write-Host "Tokenized: $file"
}

Write-Host "`nDone!"
