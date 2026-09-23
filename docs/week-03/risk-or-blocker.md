# Risks and Blockers

## Risk/Blocker: Khalti Sandbox behavior mismatch

**What is the risk or blocker?**  
The Khalti Sandbox API behavior might behave differently than expected or documented when connected to our frontend.

**Why does it matter?**  
If the frontend token cannot be properly verified by the Django backend, our candidate vertical slice (the checkout flow) fails.

**What have we tried?**  
We have read the documentation but have not yet executed live test calls against the sandbox.

**What decision or help do we need?**  
We need to confirm the exact API response format using isolated scripts before wiring it into the frontend and backend.

**Owner**  
@notyouradhee

**Next action**  
- [ ] Create a standalone test payment script in Python, isolated from the frontend, to verify the exact API response format.

---

## Risk/Blocker: Next.js and React learning curve

**What is the risk or blocker?**  
The frontend team is still learning Next.js App Router and React patterns.

**Why does it matter?**  
It could slow down the implementation of the subscription plan selector and customer dashboard if we get stuck on routing or state management.

**What have we tried?**  
We set up the base React boilerplate and initialized the PWA.

**What decision or help do we need?**  
We need to finish basic Next.js routing tutorials before diving into complex state.

**Owner**  
Aanchal / @Kushan2191

**Next action**  
- [ ] Complete basic Next.js routing tutorials.
