import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { FaEnvelope, FaLock, FaSignInAlt, FaSpinner } from "react-icons/fa";
import styles from "./LoginPage.module.css";
import commonStyles from "../styles/common.module.css";

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success("Welcome back!");
      // Після успішного входу ProtectedRoute сам побачить сесію і пропустить далі
      navigate("/addresses");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.logoTitle}>Flooring Boss</h1>
        <p className={styles.subtitle}>Sign in to manage your projects</p>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleLogin}
        >
          {({ isSubmitting }) => (
            <Form className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <div className={styles.inputWrapper}>
                  <FaEnvelope className={styles.inputIcon} />
                  <Field
                    id="email"
                    type="email"
                    name="email"
                    placeholder="admin@flooringboss.com"
                    className={styles.inputField}
                  />
                </div>
                <ErrorMessage
                  name="email"
                  component="div"
                  className={styles.errorMessage}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <div className={styles.inputWrapper}>
                  <FaLock className={styles.inputIcon} />
                  <Field
                    id="password"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className={styles.inputField}
                  />
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className={styles.errorMessage}
                />
              </div>

              <button
                type="submit"
                className={`${commonStyles.buttonPrimary} ${styles.submitButton}`}
                disabled={isSubmitting || loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <FaSignInAlt /> Sign In
                  </>
                )}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LoginPage;
