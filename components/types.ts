export type Dependent = {
  id?: string;
  name: string;
  type: "adult" | "dependant";
  notes: string;
  starterAdult: string;
  sorbet: string;
  mainCourseAdult: string;
  dessertAdult: string;
  starterKid: string;
  mainCourseKid: string;
  dessertKid: string;
};

export type RSVPFormData = {
  guest_name: string;
  starter: string;
  sorbet: string;
  main_course: string;
  dessert: string;
  notes: string;
  dependents: Dependent[];
};
