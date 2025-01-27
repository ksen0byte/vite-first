export function setupHeader(container: HTMLElement) {
  container.insertAdjacentHTML('afterbegin', headerHTML());
}

function headerHTML() {
  return `
    <header class="navbar bg-base-100 shadow-md px-4">
        <div class="flex-1">
            <div class="w-10 h-10 mr-4">
                <!--suppress HtmlUnknownTarget -->
                <img src="logo.svg" alt="Logo" class="w-full rounded-full"/>
            </div>        
        </div>
        <div class="navbar-end">
            <h1 class="font-bold text-xl" data-localize="appTitle"></h1>
        </div>
    </header>`
}