import * as Yup from "yup";

// Валідація для сторінки входу
export const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

// Валідація для звіту працівника (Daily Report) - підготовка
export const dailyReportSchema = Yup.object().shape({
  squareFeet: Yup.number()
    .typeError("Must be a number")
    .positive("Must be greater than zero")
    .required("Square feet is required"),
  notes: Yup.string().max(500, "Notes are too long"),
});
