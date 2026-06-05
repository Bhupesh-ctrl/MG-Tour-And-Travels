using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;

namespace FleetManagement.API.Claims
{
    public class SuperAdminClaimsTransformer : IClaimsTransformation
    {
        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var identity = principal.Identity as ClaimsIdentity;
            if (identity == null) return Task.FromResult(principal);

            // If the user has SuperAdmin role, add the Admin role claim as well
            if (identity.HasClaim(ClaimTypes.Role, "SuperAdmin"))
            {
                if (!identity.HasClaim(ClaimTypes.Role, "Admin"))
                {
                    identity.AddClaim(new Claim(ClaimTypes.Role, "Admin"));
                }
            }

            return Task.FromResult(principal);
        }
    }
}
