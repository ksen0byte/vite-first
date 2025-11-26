import { BiologicalAgeCalculator } from "../logic/BiologicalAge.ts";
import { setupHeader } from "../../../components/header.ts";
import { updateLanguageUI } from "../../../localization/localization.ts";
import Router from "../../../routing/router.ts";

export function setupBioAgeCalculatorScreen(appContainer: HTMLElement) {
  appContainer.innerHTML = `
    <div class="container mx-auto p-4 max-w-4xl">
      <h2 class="text-2xl font-bold mb-6 text-center" data-localize="screenBiologicalAgeCalculatorTitle"></h2>
      
      <!-- Form -->
      <div class="card bg-base-100 shadow-md">
        <div class="card-body space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text" data-localize="ageLabel">Age (7-16)</span></label>
              <input type="number" id="ba-age" class="input input-bordered validator w-full" required placeholder="12" min="7" max="16" />
            </div>
  
            <div class="form-control">
              <label class="label"><span class="label-text" data-localize="selectGender">Gender</span></label>
              <select id="ba-gender" class="select select-bordered validator w-full">
                <option value="male" data-localize="male">Male</option>
                <option value="female" data-localize="female">Female</option>
              </select>
            </div>
  
            <div class="form-control">
              <label class="label"><span class="label-text" data-localize="labelBiologicalAgeMeanSensorimotorReactionMilliseconds">Mean Reaction Time (ms)</span></label>
              <input type="number" id="ba-time" class="input input-bordered validator w-full" required placeholder="250" min="150" max="500" />
            </div>
          </div>
          
          <!-- Calculate Button -->
          <button id="ba-calculate-btn" class="btn btn-primary w-full mt-2 sm:w-auto sm:px-10" data-localize="buttonBiologicalAgeCalculate">Calculate</button>

          <div id="ba-result" class="alert shadow-md mt-2 hidden">
            <p id="ba-output-text"></p>
          </div>
        </div>
      </div>

      <!-- Formulas -->
      <div class="card bg-base-100 shadow-md mt-2">
        <div class="card-body p-4">
          
          <h3 class="card-title text-sm opacity-70 mb-2" data-localize="headingBiologicalAgeFormulasUsed"></h3>
      
          <!--math block -->
          <div class="flex flex-col sm:flex-row justify-center items-center gap-6 my-4 ">
            <div class="text-xl" data-localize-math="formulaBiologicalAgeText"></div>
            <div class="hidden sm:block w-px h-10 bg-base-300"></div> 
            <div class="text-xl" data-localize-math="formulaTempoOfBiologicalDevelopmentText"></div>
          </div>
      
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs opacity-80 bg-base-200 p-3 rounded-box mt-2">
             <div class="flex gap-2 items-start">
                <span class="font-bold font-mono whitespace-nowrap" data-localize-math="variableActualSensorimotorReaction"></span>
                <span>—</span>
                <span data-localize="descriptionActualSensorimotorReaction"></span>
             </div>
             <div class="flex gap-2 items-start">
                <span class="font-bold font-mono whitespace-nowrap" data-localize-math="variableNormativeSensorimotorReaction"></span>
                <span>—</span>
                <span data-localize="descriptionNormativeSensorimotorReaction"></span>
             </div>
             <div class="flex gap-2 items-start">
                <span class="font-bold font-mono whitespace-nowrap" data-localize-math="variableBiologicalAge"></span>
                <span>—</span>
                <span data-localize="descriptionBiologicalAge"></span>
             </div>
             <div class="flex gap-2 items-start">
                <span class="font-bold font-mono whitespace-nowrap" data-localize-math="variableTempoOfBiologicalDevelopment"></span>
                <span>—</span>
                <span data-localize="descriptionTempoOfBiologicalDevelopment"></span>
             </div>
             <div class="flex gap-2 items-start">
                <span class="font-bold font-mono whitespace-nowrap" data-localize-math="variableChildPassportAge"></span>
                <span>—</span>
                <span data-localize="descriptionChildPassportAge"></span>
             </div>
          </div>
      
          <div class="mt-4">
            <h4 class="font-bold text-xs uppercase opacity-60 mb-3" data-localize="headingBiologicalAgeTempoInterpretation"></h4>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              
              <div class="p-3 border border-warning/30 bg-warning/5 rounded-lg flex flex-col items-center text-center gap-1">
                 <span class="font-bold text-warning text-sm" data-localize="conditionBiologicalAgeAcceleratedDevelopment"></span>
                 <span class="opacity-90 leading-tight" data-localize="descriptionBiologicalAgeAcceleratedDevelopment"></span>
              </div>
      
              <div class="p-3 border border-success/30 bg-success/5 rounded-lg flex flex-col items-center text-center gap-1">
                 <span class="font-bold text-success text-sm" data-localize="conditionBiologicalAgeNormalDevelopment"></span>
                 <span class="opacity-90 leading-tight" data-localize="descriptionBiologicalAgeNormalDevelopment"></span>
              </div>
      
              <div class="p-3 border border-error/30 bg-error/5 rounded-lg flex flex-col items-center text-center gap-1">
                 <span class="font-bold text-error text-sm" data-localize="conditionBiologicalAgeDelayedDevelopment"></span>
                 <span class="opacity-90 leading-tight" data-localize="descriptionBiologicalAgeDelayedDevelopment"></span>
              </div>
      
            </div>
          </div>
      
        </div>
      </div>

      <!-- Normative table -->
      <div class="card bg-base-100 shadow-md mt-2">
        <div class="card-body">
          <h3 class="text-xl font-semibold mb-2" data-localize="headingBiologicalAgeNormativeSensorimotorValues">Normative values (ms)</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-xs text-xs leading-tight">
              <thead>
                <tr>
                  <th data-localize="columnNormativeSensorimotorAgeYears">Age (years)</th>
                  <th data-localize="columnNormativeSensorimotorBoysMs">Boys (ms)</th>
                  <th data-localize="columnNormativeSensorimotorGirlsMs">Girls (ms)</th>
                </tr>
              </thead>
              <tbody id="ba-norms-body"></tbody>
            </table>
          </div>
        </div>
      </div>

      <button id="ba-back-btn" class="btn btn-ghost mt-4 w-full" data-localize="backToMainPage"></button>
    </div>
  `;

  setupHeader(appContainer);
  updateLanguageUI();

  // Logic
  document.getElementById('ba-back-btn')?.addEventListener('click', () => Router.navigate('/'));
  
  document.getElementById('ba-calculate-btn')?.addEventListener('click', () => {
    const age = Number((document.getElementById('ba-age') as HTMLInputElement).value);
    const time = Number((document.getElementById('ba-time') as HTMLInputElement).value);
    const gender = (document.getElementById('ba-gender') as HTMLSelectElement).value as 'male' | 'female';

    const result = BiologicalAgeCalculator.calculate(time, age, gender);
    const resultDiv = document.getElementById('ba-result')!;
    const outputText = document.getElementById('ba-output-text')!;

    if (result) {
      resultDiv.classList.remove('hidden', 'alert-error');
      resultDiv.classList.add('alert-success');
      outputText.innerHTML = `
        <span data-localize="descriptionBiologicalAge">Biological Age</span>: <strong>${result.biologicalAge.toFixed(2)}</strong><br>
        <span data-localize="descriptionTempoOfBiologicalDevelopment">Tempo of Biological Development (TBR)</span>: <strong>${result.tempoBiologicalDevelopment.toFixed(2)}</strong><br>
        <span data-localize="labelBiologicalAgeInterpretationStatus"></span>: <span data-localize="${result.interpretation}"></span>
      `;
    } else {
      resultDiv.classList.remove('hidden', 'alert-success');
      resultDiv.classList.add('alert-error');
      outputText.innerHTML = `<span data-localize="errorBiologicalAgeInvalidInput">Biological Age</span>`;
    }
    updateLanguageUI();
  });

  // Render normative table rows
  const tbody = document.getElementById('ba-norms-body');
  if (tbody) {
    const ages = Object.keys(BiologicalAgeCalculator.normativeMs.male)
      .map(Number)
      .sort((a, b) => a - b);
    tbody.innerHTML = ages.map(a => {
      const m = BiologicalAgeCalculator.normativeMs.male[a];
      const f = BiologicalAgeCalculator.normativeMs.female[a];
      return `<tr class="text-center"><td>${a}</td><td>${m.toFixed(2)}</td><td>${f.toFixed(2)}</td></tr>`;
    }).join("");
  }
}
