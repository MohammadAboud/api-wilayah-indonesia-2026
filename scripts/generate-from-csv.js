const fs = require('fs');
const path = require('path');
// const csv = require('csv-parse/sync'); // We might need to install this or use simple split

// Simple CSV parser since we don't want to depend on extra libs if possible
// But idn-area-data might have dependencies. Let's just use simple split for now as the data is simple.
// Actually, let's check if csv-parse is available or just use string manipulation.
// The data seems simple enough: code,name or code,parent_code,name. No quotes or complex stuff observed in head.

const root = path.resolve(__dirname, '..');
const apiDir = path.join(root, 'api');
const dataDir = path.join(root, 'node_modules/idn-area-data/data');

// Ensure output directories exist
const dirs = ['regencies', 'districts', 'villages'];
dirs.forEach(d => {
  const p = path.join(apiDir, d);
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
  fs.mkdirSync(p, { recursive: true });
});

// Helper to strip dots from code
const cleanCode = (code) => code.replace(/\./g, '');

// Helper to read CSV
const readCsv = (filename) => {
  const content = fs.readFileSync(path.join(dataDir, filename), 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i] ? values[i].trim() : '';
    });
    return obj;
  });
};

// 1. Provinces
console.log('Processing Provinces...');
const provincesRaw = readCsv('provinces.csv');
const provinces = provincesRaw.map(p => ({
  id: cleanCode(p.code),
  name: p.name
}));
fs.writeFileSync(path.join(apiDir, 'provinces.json'), JSON.stringify(provinces));

// 2. Regencies
console.log('Processing Regencies...');
const regenciesRaw = readCsv('regencies.csv');
const regencies = regenciesRaw.map(r => ({
  id: cleanCode(r.code),
  provinceId: cleanCode(r.province_code),
  name: r.name
}));
fs.writeFileSync(path.join(apiDir, 'regencies.json'), JSON.stringify(regencies));

// Split Regencies by Province
const regenciesByProvince = {};
regencies.forEach(r => {
  if (!regenciesByProvince[r.provinceId]) regenciesByProvince[r.provinceId] = [];
  regenciesByProvince[r.provinceId].push(r);
});
Object.keys(regenciesByProvince).forEach(pId => {
  fs.writeFileSync(path.join(apiDir, 'regencies', `${pId}.json`), JSON.stringify(regenciesByProvince[pId]));
});

// 3. Districts
console.log('Processing Districts...');
const districtsRaw = readCsv('districts.csv');
const districts = districtsRaw.map(d => ({
  id: cleanCode(d.code),
  regencyId: cleanCode(d.regency_code),
  name: d.name
}));
fs.writeFileSync(path.join(apiDir, 'districts.json'), JSON.stringify(districts));

// Split Districts by Regency
const districtsByRegency = {};
districts.forEach(d => {
  if (!districtsByRegency[d.regencyId]) districtsByRegency[d.regencyId] = [];
  districtsByRegency[d.regencyId].push(d);
});
Object.keys(districtsByRegency).forEach(rId => {
  fs.writeFileSync(path.join(apiDir, 'districts', `${rId}.json`), JSON.stringify(districtsByRegency[rId]));
});

// 4. Villages
console.log('Processing Villages...');
const villagesRaw = readCsv('villages.csv');
const villages = villagesRaw.map(v => ({
  id: cleanCode(v.code),
  districtId: cleanCode(v.district_code),
  name: v.name
}));
// fs.writeFileSync(path.join(apiDir, 'villages.json'), JSON.stringify(villages)); // Too big, skip or keep? User had it before.
// Let's keep it but minified it's huge (10MB+). The user had it before.
fs.writeFileSync(path.join(apiDir, 'villages.json'), JSON.stringify(villages));

// Split Villages by District
const villagesByDistrict = {};
villages.forEach(v => {
  if (!villagesByDistrict[v.districtId]) villagesByDistrict[v.districtId] = [];
  villagesByDistrict[v.districtId].push(v);
});
Object.keys(villagesByDistrict).forEach(dId => {
  fs.writeFileSync(path.join(apiDir, 'villages', `${dId}.json`), JSON.stringify(villagesByDistrict[dId]));
});

console.log('Done!');
