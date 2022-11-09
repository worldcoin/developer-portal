/* eslint-disable @next/next/no-head-element */
/* eslint-disable @next/next/no-page-custom-font */
/* eslint-disable @next/next/no-img-element */
import { Link } from "common/Link";
import { CSSProperties, ReactNode } from "react";

export const Layout = (props: {
  title: string;
  children: ReactNode;
  style: CSSProperties;
  wrapperStyle?: CSSProperties;
}) => {
  return (
    <html>
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>{props.title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          a {
            text-decoration: none;
          }
        `}</style>
      </head>

      <body
        style={{
          fontSize: 16,
          lineHeight: 1.3,
          color: "#191C20",
          fontFamily: "Rubik, sans-serif",
        }}
      >
        <div
          style={{
            padding: "40px 60px 90px",
            background:
              "linear-gradient(90deg, rgba(255, 240, 237, 0.5) 0%, rgba(237, 236, 252, 0.5) 100%), #FFFFFF",
            ...props.wrapperStyle,
          }}
        >
          <div style={{ width: "100%", textAlign: "center" }}>
            <img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/email/logo-dev.png`}
              alt="Worldcoin dev portal"
              width={175}
              height={45}
              style={{ maxWidth: "100%", margin: "0 auto" }}
            />
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: 650,
              margin: "0 auto",
              padding: "40px",
              background: "#FFFFFF",
              boxShadow:
                "0px 2px 8px rgba(0, 0, 0, 0.04), 0px 10px 32px rgba(37, 57, 129, 0.04)",
              borderRadius: 12,
              marginTop: 65,
              ...props.style,
            }}
          >
            {props.children}
          </div>

          <div style={{ width: "100%", textAlign: "center" }}>
            <img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/email/logo.png`}
              alt="Worldcoin"
              width={140}
              height={23}
              style={{ maxWidth: "100%", margin: "0 auto", paddingTop: 43 }}
            />

            <table
              style={{
                margin: "0 auto",
                marginTop: 40,
                fontSize: 14,
              }}
            >
              <tr>
                <td>
                  {/* FIXME: add link */}
                  <Link href="#!" style={{ color: "#191C20" }}>
                    Support
                  </Link>
                </td>

                <td style={{ padding: "0 16px" }}>&middot;</td>

                <td>
                  {/* FIXME: add link */}
                  <Link href="#!" style={{ color: "#191C20" }}>
                    Privacy Policy
                  </Link>
                </td>

                <td style={{ padding: "0 16px" }}>&middot;</td>

                <td>
                  {/* FIXME: add link */}
                  <Link href="#!" style={{ color: "#191C20" }}>
                    Terms of Use
                  </Link>
                </td>
              </tr>
            </table>

            <table style={{ margin: "0 auto", marginTop: 24 }}>
              <tr>
                <td>
                  <address
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      color: "#858494",
                    }}
                  >
                    {/* FIXME: placeholder text */}
                    Worldcoin LTD, No.815821, registered in XYZ,
                    <br />
                    Address of the company
                  </address>
                </td>
              </tr>
            </table>

            <table style={{ margin: "0 auto", marginTop: 24, fontSize: 14 }}>
              <tr>
                <td style={{ paddingRight: 25 }}>
                  {/* FIXME: add link */}
                  <a href="#!">
                    <img
                      src={`${process.env.NEXT_PUBLIC_APP_URL}/email/twitter.png`}
                      alt="Worldcoin twitter"
                      width={19}
                      height={16}
                    />
                  </a>
                </td>

                <td>
                  {/* FIXME: add link */}
                  <a href="#!">
                    <img
                      src={`${process.env.NEXT_PUBLIC_APP_URL}/email/discord.png`}
                      alt="Worldcoin twitter"
                      width={19}
                      height={16}
                    />
                  </a>
                </td>
              </tr>
            </table>

            <p
              style={{
                paddingTop: 26,
                fontSize: 12,
                letterSpacing: 0.2,
                color: "#858494",
              }}
            >
              © 2021-{new Date().getFullYear()} Worldcoin
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
