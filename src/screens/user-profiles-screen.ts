import { setupHeader } from '../components/header';
import { setupFooter } from '../components/footer';
import { updateLanguageUI } from '../localization/localization';
import { User } from "../db/db";
import { setupProfileScreen } from "./user-profile-screen";
import { setupSettingsScreen } from "./settings-screen";
import { getAllUsers, getTestsForUser } from "../db/operations";

export class UsersScreen {
  private readonly appContainer: HTMLElement;

  constructor(appContainer: HTMLElement) {
    this.appContainer = appContainer;

    // Bind methods to ensure `this` context is preserved
    this.setupScreen = this.setupScreen.bind(this);
    this.viewUserProfile = this.viewUserProfile.bind(this);
  }

  /**
   * Renders the Users Screen.
   */
  public async setupScreen() {
    const users = await getAllUsers();

    this.appContainer.innerHTML = `
      <div id="users-screen" class="flex flex-col flex-grow bg-base-200 text-base-content p-4">
        <div class="flex-1 space-y-4">
            ${users.map(this.userCardHTML).join("")}
        </div>
      </div>
    `;

    // Set up the header
    setupHeader(this.appContainer);

    // Setup the footer with `main-page-btn`
    setupFooter(
      this.appContainer,
      this.usersScreenFooterHTML(),
      [
        { buttonFn: () => document.getElementById("main-page-btn")! as HTMLButtonElement, callback: () => this.navigateToMainPage() }
      ]
    );

    this.attachEventListeners();

    updateLanguageUI();
  }

  /**
   * Generates the HTML for a user card.
   */
  private userCardHTML(user: User): string {
    const { firstName, lastName, gender, age } = user;

    return `
      <div class="card shadow-md bg-base-100">
        <div class="card-body">
          <div class="flex justify-between">
            <h2 class="card-title">${firstName} ${lastName}</h2>
            <button class="btn btn-sm btn-outline btn-info view-profile-btn" data-first-name="${firstName}" data-last-name="${lastName}">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /> </svg>
              <span data-localize="viewProfileButton"></span>
            </button>
          </div>
          <div class="space-y-2">
            <p><strong data-localize="ageLabel"></strong>: ${age ?? '-'}</p>
            <p class="${gender === "male" ? "" : "hidden"}"><strong data-localize="selectGender"></strong>: <span data-localize="male"></span></p>
            <p class="${gender === "female" ? "" : "hidden"}"><strong data-localize="selectGender"></strong>: <span data-localize="female"></span></p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attaches event listeners to dynamically generated buttons.
   */
  private attachEventListeners() {
    const userButtons = this.appContainer.querySelectorAll<HTMLButtonElement>('.view-profile-btn');
    userButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const firstName = button.getAttribute('data-first-name')!;
        const lastName = button.getAttribute('data-last-name')!;
        await this.viewUserProfile(firstName, lastName); // Call class method
      });
    });
  }


  /**
   * Generates the footer HTML for the screen.
   */
  private usersScreenFooterHTML(): string {
    return `
      <footer id="user-profile-footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
        <div class="flex-1"></div>
        <button id="main-page-btn" class="btn btn-outline btn-success" data-localize="backToMainPage"></button>
      </footer>
    `;
  }

  /**
   * Handles navigation to the user's profile.
   */
  public async viewUserProfile(firstName: string, lastName: string): Promise<void> {
    const user = (await getAllUsers()).find(u => u.firstName === firstName && u.lastName === lastName);

    if (!user) {
      console.error("User not found!");
      return;
    }

    const tests = await getTestsForUser(firstName, lastName);

    setupProfileScreen(this.appContainer, user, tests);
  }

  /**
   * Navigates back to the main page (e.g. settings screen).
   */
  private navigateToMainPage() {
    setupSettingsScreen(this.appContainer);
  }
}
