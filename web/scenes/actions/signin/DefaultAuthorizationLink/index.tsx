import { Menu } from "@headlessui/react";
import { Button } from "common/Button";
import { Icon } from "common/Icon";
import { Fragment, memo } from "react";
import { shallow } from "zustand/shallow";
import { useSignInActionStore } from "../store";

export const DefaultAuthorizationLink = memo(
  function DefaultAuthorizationLink() {
    const { redirectInputs, defaultRedirect, setDefaultRedirect } =
      useSignInActionStore((state) => ({ ...state }), shallow);

    return (
      <Fragment>
        {redirectInputs.length > 0 && (
          <section className="grid gap-y-4">
            <div className="grid gap-y-2">
              <h4 className="font-medium">Default Authorization Link</h4>
              <p className="text-14 text-neutral-secondary leading-none">
                You must specify at least one URL for authentication to work.
              </p>
            </div>

            <div className="grid gap-y-1">
              <div className="rounded-xl bg-f3f4f5 overflow-hidden">
                <Menu>
                  <Menu.Button className="w-full py-3 px-4">
                    <div className="flex items-center  w-full">
                      <span>{defaultRedirect ?? ""}</span>

                      <Icon name="angle-down" className="h-6 w-6 ml-auto" />
                    </div>
                  </Menu.Button>
                  <Menu.Items className="border-t border-neutral-secondary/20">
                    {redirectInputs.map((value, index) => (
                      <Menu.Item key={`signin-default-redirect-item-${index}`}>
                        {({ active }) => (
                          <button className="py-3 px-4 hover:bg-neutral-secondary/10 w-full">
                            <div
                              className={`flex items-center  w-full ${
                                active ? "bg-neutral-light" : ""
                              }`}
                              onClick={() => setDefaultRedirect(value)}
                            >
                              <span>{redirectInputs[index]}</span>
                            </div>
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Menu>
              </div>

              <span className="text-12 text-neutral-secondary">
                We’ll verify the proof in the right network and make sure you
                have a valid identity too.
              </span>
            </div>
          </section>
        )}
      </Fragment>
    );
  }
);
