#!/usr/bin/env python3
"""
Unisce in un unico openapi.yaml tutti i file swagger_*.yaml
(serve solo PyYAML, che pesa pochi KB).
"""
import yaml, pathlib, sys

base_dir = pathlib.Path(__file__).parent
# Raccogli automaticamente tutti i file "swagger_*.yaml" presenti nella cartella.
# Mantieni come primo file `swagger_accounts.yaml` se esiste, perché funge da scheletro
# (contiene `openapi`, `info`, ecc.). In caso contrario, usa il primo della lista
# alfabetica come base.
found = sorted(f.name for f in base_dir.glob('swagger_*.yaml') if f.name != 'openapi.yaml')

if not found:
    sys.exit('❌  Nessun file swagger_*.yaml trovato')

if 'swagger_accounts.yaml' in found:
    found.remove('swagger_accounts.yaml')
    files = ['swagger_accounts.yaml', *found]
else:
    files = found

# Carica il primo file come “scheletro”
merged = yaml.safe_load((base_dir / files[0]).read_text())

for name in files[1:]:
    data = yaml.safe_load((base_dir / name).read_text())
    # paths
    merged.setdefault('paths', {}).update(data.get('paths', {}))
    # components (schemas, ecc.)
    for comp_key, comp_val in data.get('components', {}).items():
        merged.setdefault('components', {}).setdefault(comp_key, {}).update(comp_val)
    # tags (lista in cima al file, opzionale ma utile per ordinare)
    if 'tags' in data:
        existing = {t['name'] for t in merged.get('tags', []) if isinstance(t, dict)}
        for tag_obj in data['tags']:
            if isinstance(tag_obj, dict) and tag_obj.get('name') not in existing:
                merged.setdefault('tags', []).append(tag_obj)
    # servers (unisci senza duplicati)
    if 'servers' in data:
        merged.setdefault('servers', [])
        for srv in data['servers']:
            if srv not in merged['servers']:
                merged['servers'].append(srv)

# Output finale
out = base_dir / 'openapi.yaml'
out.write_text(yaml.dump(merged, sort_keys=False, allow_unicode=True))
print(f'✅  creato {out.relative_to(base_dir.parent)}')